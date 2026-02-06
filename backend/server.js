// server.js - Modern Attendance System Backend
/**
 * RFID Attendance System Backend API
 * 
 * A complete REST API for managing employee attendance using RFID cards.
 * 
 * Features:
 * - Device authentication with API keys
 * - Admin authentication with JWT tokens
 * - Real-time WebSocket updates for attendance events
 * - Rate limiting for tap endpoint (100 req/min per device)
 * - Configurable cooldown between duplicate taps
 * - Complete audit logging
 * 
 * Base URL: http://localhost:3000 (development)
 * 
 * See API_DOCUMENTATION.md for complete endpoint reference
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import database query helpers
const db = require('./lib/supabase-queries');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Supabase client with service role key (for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// ==========================================
// MIDDLEWARE
// ==========================================

// Device API Key Authentication
const authenticateDevice = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  try {
    const { data: devices, error } = await supabase
      .from('devices')
      .select('*')
      .eq('api_key', apiKey)
      .eq('status', 'active')
      .limit(1);
    
    if (error || !devices || devices.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    const device = devices[0];
    req.device = device;
    
    // Update last_seen timestamp
    const { error: updateError } = await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', device.id);
    
    if (updateError) {
      console.error('Failed to update device last_seen:', updateError);
    }
    
    next();
  } catch (error) {
    console.error('Device auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Admin JWT Authentication
const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting for tap endpoint
const tapRateLimiter = new Map();
const TAP_RATE_LIMIT = process.env.TAP_RATE_LIMIT || 100; // requests per minute
const TAP_WINDOW = 60000; // 1 minute
const TAP_COOLDOWN = process.env.DEVICE_TAP_COOLDOWN || 10000; // 10 seconds cooldown between taps

const checkTapRateLimit = (req, res, next) => {
  const key = req.device.id;
  const now = Date.now();
  
  if (!tapRateLimiter.has(key)) {
    tapRateLimiter.set(key, []);
  }
  
  const requests = tapRateLimiter.get(key);
  const recentRequests = requests.filter(time => now - time < TAP_WINDOW);
  
  if (recentRequests.length >= TAP_RATE_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  recentRequests.push(now);
  tapRateLimiter.set(key, recentRequests);
  next();
};

// Tap cooldown tracking to prevent duplicate taps
const tapCooldown = new Map();

const checkTapCooldown = (deviceId, uid) => {
  const key = `${deviceId}_${uid}`;
  const now = Date.now();
  const lastTap = tapCooldown.get(key);
  
  if (lastTap && (now - lastTap) < TAP_COOLDOWN) {
    return false;
  }
  
  tapCooldown.set(key, now);
  return true;
};

// ==========================================
// CORE ENDPOINTS
// ==========================================

// Use local date (YYYY-MM-DD) to avoid timezone mismatch
const getLocalDateString = () => new Date().toLocaleDateString('en-CA');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// RFID Tap Endpoint (Main)
app.post('/api/tap', authenticateDevice, checkTapRateLimit, async (req, res) => {
  const { uid, timestamp } = req.body;
  const deviceId = req.device.id;
  
  if (!uid) {
    return res.status(400).json({ error: 'UID required' });
  }
  
  try {
    // Check cooldown to prevent duplicate taps
    if (!checkTapCooldown(deviceId, uid.toUpperCase())) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    // Find employee by RFID UID
    const employee = await db.getEmployeeByRFID(supabase, uid.toUpperCase());
    
    if (!employee) {
      return res.status(404).json({ 
        error: 'Card not registered',
        uid: uid
      });
    }
    
    const today = getLocalDateString();
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // Check for existing session today
    const session = await db.getTodaySession(supabase, employee.id, today);
    
    let action, sessionId, isLate = false, notes = [];
    
    if (!session || session.time_out !== null) {
      // No session today OR last session completed → TIME IN
      
      // Check if late (after 8:15 AM)
      if (currentTime > '08:15') {
        isLate = true;
        notes.push(`Late arrival: ${currentTime}`);
      }
      
      const newSession = await db.createSession(supabase, employee.id, today, deviceId);
      
      if (!newSession) {
        return res.status(500).json({ error: 'Failed to create session' });
      }
      
      // Update session with late status
      if (isLate) {
        await supabase
          .from('attendance_sessions')
          .update({ 
            is_late: true,
            notes: notes.join('; ')
          })
          .eq('id', newSession.id);
      }
      
      sessionId = newSession.id;
      action = 'TIME_IN';
      
    } else {
      // Existing session without time_out → TIME OUT
      
      // Validate time out (should not exceed 5:00 PM for counting)
      const timeIn = new Date(session.time_in);
      const timeInHour = timeIn.getHours();
      const timeInMinute = timeIn.getMinutes();
      
      // Check if this is lunch time out (around 12:00 PM)
      if (currentTime >= '11:45' && currentTime <= '12:30') {
        notes.push('Lunch break time out');
      }
      
      // Check if time in was before 8:00 AM (valid start time)
      if (timeInHour < 8 || (timeInHour === 8 && timeInMinute === 0)) {
        // Valid morning time in
      }
      
      await db.updateSessionTimeOut(supabase, session.id, deviceId);
      
      // Add notes if any
      if (notes.length > 0) {
        await supabase
          .from('attendance_sessions')
          .update({ 
            notes: notes.join('; ')
          })
          .eq('id', session.id);
      }
      
      sessionId = session.id;
      action = 'TIME_OUT';
    }
    
    // Get complete session data with calculated duration
    const updatedSession = await db.getSessionWithDetails(supabase, sessionId);
    
    // Calculate duration in minutes
    let durationMinutes = null;
    if (updatedSession.time_out) {
      durationMinutes = Math.floor((new Date(updatedSession.time_out) - new Date(updatedSession.time_in)) / 60000);
    }
    
    const responseData = {
      status: 'success',
      action: action,
      name: employee.full_name,
      employee_code: employee.employee_code,
      time: new Date().toISOString(),
      is_late: isLate,
      notes: notes.join('; ') || null,
      session: {
        ...updatedSession,
        duration_minutes: durationMinutes
      }
    };
    
    // Broadcast to all connected clients
    io.emit('attendance_update', responseData);
    
    // Log to audit
    await db.createAuditLog(supabase, 'attendance_tap', 'device', deviceId, {
      employee_id: employee.id,
      action: action,
      uid: uid
    });
    
    console.log(`[TAP] ${employee.full_name} - ${action} - ${new Date().toLocaleTimeString()}`);
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Tap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await db.getAdminByUsername(supabase, username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all employees
app.get('/api/employees', authenticateAdmin, async (req, res) => {
  try {
    const employees = await db.getAllEmployees(supabase);
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Add new employee
app.post('/api/employees', authenticateAdmin, async (req, res) => {
  const { full_name, employee_code, role, program, photo_url } = req.body;
  
  if (!full_name || !employee_code) {
    return res.status(400).json({ error: 'Name and code required' });
  }
  
  const allowedPrograms = ['CpE', 'IT'];
  const normalizedProgram = program || 'CpE';
  
  if (normalizedProgram && !allowedPrograms.includes(normalizedProgram)) {
    return res.status(400).json({ error: 'Invalid program. Use CpE or IT' });
  }
  
  try {
    const newEmployee = await db.createEmployee(supabase, {
      full_name,
      employee_code,
      role: role || 'intern',
      program: normalizedProgram,
      photo_url: photo_url || null
    });
    
    if (!newEmployee) {
      return res.status(500).json({ error: 'Failed to create employee' });
    }
    
    await db.createAuditLog(supabase, 'employee_created', 'admin', req.admin.id, { employee_id: newEmployee.id });
    
    res.json({
      id: newEmployee.id,
      full_name,
      employee_code,
      role: role || 'intern',
      program: normalizedProgram
    });
    
  } catch (error) {
    if (error.message && error.message.includes('duplicate')) {
      res.status(400).json({ error: 'Employee code already exists' });
    } else {
      console.error('Add employee error:', error);
      res.status(500).json({ error: 'Failed to add employee' });
    }
  }
});

// Update employee
app.put('/api/employees/:id', authenticateAdmin, async (req, res) => {
  const employeeId = req.params.id;
  const { full_name, employee_code, role, program, rfid_uid } = req.body;
  
  if (!full_name || !employee_code) {
    return res.status(400).json({ error: 'Name and code required' });
  }
  
  const allowedPrograms = ['CpE', 'IT'];
  const normalizedProgram = program || 'CpE';
  
  if (normalizedProgram && !allowedPrograms.includes(normalizedProgram)) {
    return res.status(400).json({ error: 'Invalid program. Use CpE or IT' });
  }
  
  try {
    const { data, error } = await supabase
      .from('employees')
      .update({
        full_name,
        employee_code,
        role: role || 'intern',
        program: normalizedProgram,
        rfid_uid: rfid_uid || null
      })
      .eq('id', employeeId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    await db.createAuditLog(supabase, 'employee_updated', 'admin', req.admin.id, { employee_id: employeeId });
    
    res.json({
      id: data.id,
      full_name: data.full_name,
      employee_code: data.employee_code,
      role: data.role,
      program: data.program,
      rfid_uid: data.rfid_uid
    });
    
  } catch (error) {
    if (error.message && error.message.includes('duplicate')) {
      res.status(400).json({ error: 'Employee code already exists' });
    } else {
      console.error('Update employee error:', error);
      res.status(500).json({ error: 'Failed to update employee' });
    }
  }
});

// Assign RFID card to employee
app.post('/api/employees/:id/assign-card', authenticateAdmin, async (req, res) => {
  const employeeId = req.params.id;
  const { rfid_uid } = req.body;
  
  if (!rfid_uid) {
    return res.status(400).json({ error: 'RFID UID required' });
  }
  
  try {
    // Check if UID is already assigned
    const existing = await db.checkRFIDExists(supabase, rfid_uid.toUpperCase(), employeeId);
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Card already assigned',
        assigned_to: existing.full_name
      });
    }
    
    await db.assignRFIDCard(supabase, employeeId, rfid_uid.toUpperCase());
    
    await db.createAuditLog(supabase, 'card_assigned', 'admin', req.admin.id, { employee_id: employeeId, uid: rfid_uid });
    
    res.json({ success: true, rfid_uid: rfid_uid.toUpperCase() });
    
  } catch (error) {
    console.error('Assign card error:', error);
    res.status(500).json({ error: 'Failed to assign card' });
  }
});

// Get attendance logs
app.get('/api/attendance', authenticateAdmin, async (req, res) => {
  const { date, employee_id, limit = 100 } = req.query;
  
  try {
    const logs = await db.getAttendanceLogs(supabase, date, employee_id, parseInt(limit));
    
    // Calculate duration in minutes for each log
    const logsWithDuration = logs.map(log => ({
      ...log,
      duration_minutes: log.time_out 
        ? Math.floor((new Date(log.time_out) - new Date(log.time_in)) / 60000)
        : null
    }));
    
    res.json(logsWithDuration);
    
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get today's summary
app.get('/api/dashboard/today', authenticateAdmin, async (req, res) => {
  const today = getLocalDateString();
  
  try {
    const stats = await db.getDashboardStats(supabase, today);
    
    res.json({
      present: stats.present,
      total: stats.total,
      currently_in: stats.currently_in,
      absent: stats.absent,
      recent_taps: stats.recent_taps
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ==========================================
// DEVICE MANAGEMENT
// ==========================================

app.get('/api/devices', authenticateAdmin, async (req, res) => {
  try {
    const devices = await db.getAllDevices(supabase);
    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

app.post('/api/devices', authenticateAdmin, async (req, res) => {
  const { device_name, location } = req.body;
  
  if (!device_name) {
    return res.status(400).json({ error: 'Device name required' });
  }
  
  const deviceId = `device_${Date.now()}`;
  const crypto = require('crypto');
  const apiKey = crypto.randomBytes(32).toString('hex');
  
  try {
    const device = await db.createDevice(supabase, deviceId, device_name, apiKey, location || null);
    
    res.json({
      id: device.id,
      device_id: deviceId,
      api_key: apiKey,
      device_name,
      location: location || null
    });
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// ==========================================
// DTR (DAILY TIME RECORD) REPORTS
// ==========================================

// Get DTR summary for all employees
app.get('/api/reports/dtr', authenticateAdmin, async (req, res) => {
  try {
    // Default to January 28, 2026 as start date
    const startDate = req.query.startDate || '2026-01-28';
    const endDate = req.query.endDate || getLocalDateString();
    
    const dtrSummary = await db.getAllEmployeesDTR(supabase, startDate, endDate);
    
    res.json({
      startDate,
      endDate,
      employees: dtrSummary
    });
    
  } catch (error) {
    console.error('DTR summary error:', error);
    res.status(500).json({ error: 'Failed to fetch DTR summary' });
  }
});

// Get detailed DTR for a specific employee
app.get('/api/reports/dtr/:employeeId', authenticateAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const startDate = req.query.startDate || '2026-01-28';
    const endDate = req.query.endDate || getLocalDateString();
    
    const dtr = await db.getEmployeeDTR(supabase, employeeId, startDate, endDate);
    
    res.json({
      startDate,
      endDate,
      ...dtr
    });
    
  } catch (error) {
    console.error('DTR detail error:', error);
    res.status(500).json({ error: 'Failed to fetch employee DTR' });
  }
});

// ==========================================
// WEBSOCKET
// ==========================================

io.on('connection', (socket) => {
  console.log('[WS] Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('[WS] Client disconnected:', socket.id);
  });
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Attendance System Backend Started!      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`[✓] Server running on port ${PORT}`);
  console.log(`[✓] WebSocket server ready`);
  console.log(`[i] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📡 API Endpoints:');
  console.log('  ├─ Public');
  console.log('  │  └─ GET  /api/health - Server health check');
  console.log('  ├─ Authentication');
  console.log('  │  └─ POST /api/admin/login - Admin login');
  console.log('  ├─ Device (requires X-API-Key header)');
  console.log('  │  └─ POST /api/tap - RFID tap endpoint');
  console.log('  ├─ Employees (requires JWT token)');
  console.log('  │  ├─ GET  /api/employees - List employees');
  console.log('  │  ├─ POST /api/employees - Add new employee');
  console.log('  │  └─ POST /api/employees/:id/assign-card - Assign RFID card');
  console.log('  ├─ Attendance (requires JWT token)');
  console.log('  │  ├─ GET  /api/attendance - Attendance logs');
  console.log('  │  └─ GET  /api/dashboard/today - Today\'s summary');
  console.log('  └─ Devices (requires JWT token)');
  console.log('     ├─ GET  /api/devices - List devices');
  console.log('     └─ POST /api/devices - Register new device');
  console.log('');
  console.log('🌐 WebSocket Events:');
  console.log('  └─ attendance_update - Real-time attendance events');
  console.log('');
});

module.exports = { app, server, io, supabase };