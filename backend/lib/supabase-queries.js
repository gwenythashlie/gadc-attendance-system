// lib/supabase-queries.js - Database query helpers for Supabase

/**
 * Helper functions to interact with Supabase database
 * Converts MySQL-style queries to Supabase PostgREST API calls
 */

// Get employees by RFID UID
async function getEmployeeByRFID(supabase, uid) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('rfid_uid', uid.toUpperCase())
    .eq('status', 'active')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

// Get today's attendance session for employee
async function getTodaySession(supabase, employeeId, today) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .order('id', { ascending: false })
    .limit(1);
  
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

// Create new attendance session (TIME IN)
async function createSession(supabase, employeeId, today, deviceId) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      employee_id: employeeId,
      date: today,
      time_in: new Date().toISOString(),
      device_in: deviceId
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update session with TIME OUT
async function updateSessionTimeOut(supabase, sessionId, deviceId) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .update({
      time_out: new Date().toISOString(),
      device_out: deviceId
    })
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get session with employee details and duration
async function getSessionWithDetails(supabase, sessionId) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(`
      *,
      employee:employees(full_name, employee_code, photo_url, role)
    `)
    .eq('id', sessionId)
    .single();
  
  if (error) throw error;
  
  // Calculate duration in minutes if time_out exists
  if (data.time_out) {
    const timeIn = new Date(data.time_in);
    const timeOut = new Date(data.time_out);
    data.duration_minutes = Math.floor((timeOut - timeIn) / 60000);
  } else {
    data.duration_minutes = null;
  }
  
  // Flatten employee data
  if (data.employee) {
    data.full_name = data.employee.full_name;
    data.employee_code = data.employee.employee_code;
    data.photo_url = data.employee.photo_url;
    data.role = data.employee.role;
    delete data.employee;
  }
  
  return data;
}

// Get admin user by username
async function getAdminByUsername(supabase, username) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Get all employees
async function getAllEmployees(supabase) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('full_name', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// Create new employee
async function createEmployee(supabase, employeeData) {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      full_name: employeeData.full_name,
      employee_code: employeeData.employee_code,
      role: employeeData.role || 'intern',
      program: employeeData.program || 'CpE',
      required_hours: employeeData.program === 'IT' ? 500 : 320,
      photo_url: employeeData.photo_url || null
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Check if RFID UID is already assigned
async function checkRFIDExists(supabase, rfidUid, excludeEmployeeId = null) {
  let query = supabase
    .from('employees')
    .select('id, full_name')
    .eq('rfid_uid', rfidUid.toUpperCase());
  
  if (excludeEmployeeId) {
    query = query.neq('id', excludeEmployeeId);
  }
  
  const { data, error } = await query.limit(1);
  
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

// Assign RFID card to employee
async function assignRFIDCard(supabase, employeeId, rfidUid) {
  const { data, error } = await supabase
    .from('employees')
    .update({ rfid_uid: rfidUid.toUpperCase() })
    .eq('id', employeeId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get attendance logs with filters
async function getAttendanceLogs(supabase, filters = {}) {
  let query = supabase
    .from('attendance_sessions')
    .select(`
      *,
      employee:employees(full_name, employee_code, photo_url, role)
    `);
  
  if (filters.date) {
    query = query.eq('date', filters.date);
  }
  
  if (filters.employee_id) {
    query = query.eq('employee_id', filters.employee_id);
  }
  
  const limit = filters.limit || 100;
  query = query.order('date', { ascending: false })
               .order('time_in', { ascending: false })
               .limit(limit);
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Calculate duration and flatten employee data
  return (data || []).map(session => {
    if (session.time_out) {
      const timeIn = new Date(session.time_in);
      const timeOut = new Date(session.time_out);
      session.duration_minutes = Math.floor((timeOut - timeIn) / 60000);
    } else {
      session.duration_minutes = null;
    }
    
    if (session.employee) {
      session.full_name = session.employee.full_name;
      session.employee_code = session.employee.employee_code;
      session.photo_url = session.employee.photo_url;
      session.role = session.employee.role;
      delete session.employee;
    }
    
    return session;
  });
}

// Get today's dashboard stats
async function getDashboardStats(supabase, today) {
  // Get count of unique employees who have attendance today
  const { data: presentData, error: presentError } = await supabase
    .from('attendance_sessions')
    .select('employee_id', { count: 'exact', head: false })
    .eq('date', today);
  
  if (presentError) throw presentError;
  
  const presentEmployees = new Set(presentData.map(s => s.employee_id));
  const present = presentEmployees.size;
  
  // Get total active employees
  const { count: total, error: totalError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  if (totalError) throw totalError;
  
  // Get count of currently timed in (no time_out)
  const { count: currentlyIn, error: currentlyInError } = await supabase
    .from('attendance_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('date', today)
    .is('time_out', null);
  
  if (currentlyInError) throw currentlyInError;
  
  // Get recent taps
  const { data: recentTaps, error: recentError } = await supabase
    .from('attendance_sessions')
    .select(`
      *,
      employee:employees(full_name, employee_code, photo_url)
    `)
    .eq('date', today)
    .order('id', { ascending: false })
    .limit(10);
  
  if (recentError) throw recentError;
  
  // Flatten employee data in recent taps
  const flattenedTaps = (recentTaps || []).map(session => {
    if (session.employee) {
      session.full_name = session.employee.full_name;
      session.employee_code = session.employee.employee_code;
      session.photo_url = session.employee.photo_url;
      delete session.employee;
    }
    return session;
  });
  
  return {
    present,
    total: total || 0,
    currently_in: currentlyIn || 0,
    absent: (total || 0) - present,
    recent_taps: flattenedTaps
  };
}

// Get all devices
async function getAllDevices(supabase) {
  const { data, error } = await supabase
    .from('devices')
    .select('id, device_id, device_name, api_key, location, status, created_at, last_seen')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Create new device
async function createDevice(supabase, deviceName, location, apiKey, deviceId) {
  const { data, error } = await supabase
    .from('devices')
    .insert({
      device_id: deviceId,
      device_name: deviceName,
      api_key: apiKey,
      location: location || null
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Create audit log
async function createAuditLog(supabase, action, userType, userId, details) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      action,
      user_type: userType,
      user_id: userId,
      details: details ? JSON.stringify(details) : null
    });
  
  if (error) console.error('Audit log error:', error);
}

// Get DTR (Daily Time Record) for employee
async function getEmployeeDTR(supabase, employeeId, startDate, endDate) {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(`
      *,
      employee:employees(full_name, employee_code, program, required_hours)
    `)
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('time_in', { ascending: true });
  
  if (error) throw error;
  
  // Calculate duration for each session and filter weekdays only
  const sessions = (data || []).map(session => {
    const dateObj = new Date(session.date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate duration in hours
    let durationHours = 0;
    if (session.time_out) {
      const timeIn = new Date(session.time_in);
      const timeOut = new Date(session.time_out);
      durationHours = (timeOut - timeIn) / (1000 * 60 * 60); // Convert to hours
    }
    
    return {
      ...session,
      duration_hours: durationHours,
      day_of_week: dayOfWeek,
      is_weekday: dayOfWeek >= 1 && dayOfWeek <= 5
    };
  }).filter(session => session.is_weekday); // Only weekdays
  
  // Calculate total hours
  const totalHours = sessions.reduce((sum, session) => sum + session.duration_hours, 0);
  
  return {
    sessions,
    totalHours,
    employee: data && data.length > 0 ? data[0].employee : null
  };
}

// Get all employees DTR summary
async function getAllEmployeesDTR(supabase, startDate, endDate) {
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, employee_code, full_name, program, required_hours, status')
    .eq('status', 'active')
    .order('full_name', { ascending: true });
  
  if (empError) throw empError;
  
  const dtrSummary = [];
  
  for (const employee of employees || []) {
    const dtr = await getEmployeeDTR(supabase, employee.id, startDate, endDate);
    
    dtrSummary.push({
      id: employee.id,
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      program: employee.program,
      required_hours: employee.required_hours,
      total_hours: dtr.totalHours,
      hours_remaining: employee.required_hours - dtr.totalHours,
      progress_percentage: (dtr.totalHours / employee.required_hours * 100).toFixed(2),
      session_count: dtr.sessions.length
    });
  }
  
  return dtrSummary;
}

module.exports = {
  getEmployeeByRFID,
  getTodaySession,
  createSession,
  updateSessionTimeOut,
  getSessionWithDetails,
  getAdminByUsername,
  getAllEmployees,
  createEmployee,
  checkRFIDExists,
  assignRFIDCard,
  getAttendanceLogs,
  getDashboardStats,
  getAllDevices,
  createDevice,
  createAuditLog,
  getEmployeeDTR,
  getAllEmployeesDTR
};
