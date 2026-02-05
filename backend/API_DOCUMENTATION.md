# 📡 API Documentation

Complete API reference for the Attendance System backend.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

### Device Authentication
Device endpoints require an API key in the header:
```
X-API-Key: your-device-api-key-here
```

### Admin Authentication  
Admin endpoints require a JWT token:
```
Authorization: Bearer your-jwt-token-here
```

---

## 🔓 Public Endpoints

### Health Check

Check if server is running.

**Endpoint:** `GET /api/health`

**Auth:** None required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-02-04T10:30:00.000Z"
}
```

---

## 🎫 Authentication Endpoints

### Admin Login

Authenticate and get JWT token.

**Endpoint:** `POST /api/admin/login`

**Auth:** None required

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 📍 Device Endpoints

### RFID Tap (Main Endpoint)

Process an RFID card tap and record attendance.

**Endpoint:** `POST /api/tap`

**Auth:** Device API Key required

**Headers:**
```
Content-Type: application/json
X-API-Key: your-device-api-key
```

**Request Body:**
```json
{
  "uid": "A1B2C3D4",
  "device_id": "main-entrance",
  "timestamp": 1234567890
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "action": "TIME_IN",
  "name": "John Doe",
  "employee_code": "INT-001",
  "time": "2024-02-04T10:30:00.000Z",
  "session": {
    "id": 123,
    "employee_id": 5,
    "date": "2024-02-04",
    "time_in": "2024-02-04T10:30:00.000Z",
    "time_out": null,
    "device_in": 1,
    "device_out": null,
    "duration_minutes": null,
    "full_name": "John Doe",
    "employee_code": "INT-001",
    "photo_url": "https://...",
    "role": "intern"
  }
}
```

**Card Not Registered (404):**
```json
{
  "error": "Card not registered",
  "uid": "A1B2C3D4"
}
```

**Invalid API Key (401):**
```json
{
  "error": "Invalid API key"
}
```

**Rate Limited (429):**
```json
{
  "error": "Rate limit exceeded"
}
```

**Logic:**
- If no session today OR last session completed → **TIME_IN**
- If session exists with time_in but no time_out → **TIME_OUT**
- 10-second cooldown between taps (configurable)

---

## 👥 Employee Endpoints

### Get All Employees

Retrieve list of all employees.

**Endpoint:** `GET /api/employees`

**Auth:** Admin JWT required

**Response (200):**
```json
[
  {
    "id": 1,
    "employee_code": "INT-001",
    "full_name": "John Doe",
    "rfid_uid": "A1B2C3D4",
    "role": "intern",
    "photo_url": "https://...",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Add New Employee

Create a new employee record.

**Endpoint:** `POST /api/employees`

**Auth:** Admin JWT required

**Request Body:**
```json
{
  "full_name": "Jane Smith",
  "employee_code": "INT-002",
  "role": "intern",
  "photo_url": "https://example.com/photo.jpg"
}
```

**Success Response (200):**
```json
{
  "id": 2,
  "full_name": "Jane Smith",
  "employee_code": "INT-002",
  "role": "intern"
}
```

**Duplicate Code (400):**
```json
{
  "error": "Employee code already exists"
}
```

### Assign RFID Card

Assign an RFID card to an employee.

**Endpoint:** `POST /api/employees/:id/assign-card`

**Auth:** Admin JWT required

**Request Body:**
```json
{
  "rfid_uid": "E5F6G7H8"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "rfid_uid": "E5F6G7H8"
}
```

**Card Already Assigned (400):**
```json
{
  "error": "Card already assigned",
  "assigned_to": "John Doe"
}
```

---

## 📊 Attendance Endpoints

### Get Attendance Logs

Retrieve attendance records with optional filters.

**Endpoint:** `GET /api/attendance`

**Auth:** Admin JWT required

**Query Parameters:**
- `date` (optional) - Filter by date (YYYY-MM-DD)
- `employee_id` (optional) - Filter by employee
- `limit` (optional) - Number of records (default: 100)

**Examples:**
```
/api/attendance
/api/attendance?date=2024-02-04
/api/attendance?employee_id=5
/api/attendance?date=2024-02-04&limit=50
```

**Response (200):**
```json
[
  {
    "id": 123,
    "employee_id": 5,
    "date": "2024-02-04",
    "time_in": "2024-02-04T08:30:00.000Z",
    "time_out": "2024-02-04T17:15:00.000Z",
    "device_in": 1,
    "device_out": 1,
    "duration_minutes": 525,
    "created_at": "2024-02-04T08:30:00.000Z",
    "full_name": "John Doe",
    "employee_code": "INT-001",
    "photo_url": "https://...",
    "role": "intern"
  }
]
```

### Get Today's Dashboard Summary

Get today's attendance statistics and recent activity.

**Endpoint:** `GET /api/dashboard/today`

**Auth:** Admin JWT required

**Response (200):**
```json
{
  "present": 15,
  "total": 20,
  "currently_in": 12,
  "absent": 5,
  "recent_taps": [
    {
      "id": 150,
      "employee_id": 8,
      "date": "2024-02-04",
      "time_in": "2024-02-04T09:15:00.000Z",
      "time_out": null,
      "full_name": "Alice Johnson",
      "employee_code": "INT-008",
      "photo_url": "https://..."
    }
  ]
}
```

---

## 🖥️ Device Management Endpoints

### Get All Devices

List all registered RFID reader devices.

**Endpoint:** `GET /api/devices`

**Auth:** Admin JWT required

**Response (200):**
```json
[
  {
    "id": 1,
    "device_id": "main-entrance",
    "device_name": "Main Entrance Scanner",
    "api_key": "abc123...",
    "location": "Building A, Floor 1",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_seen": "2024-02-04T10:00:00.000Z"
  }
]
```

### Add New Device

Register a new RFID reader device.

**Endpoint:** `POST /api/devices`

**Auth:** Admin JWT required

**Request Body:**
```json
{
  "device_name": "Back Entrance Scanner",
  "location": "Building B, Floor 1"
}
```

**Success Response (200):**
```json
{
  "id": 2,
  "device_id": "device_1234567890",
  "api_key": "generated-secure-key-here",
  "device_name": "Back Entrance Scanner",
  "location": "Building B, Floor 1"
}
```

**⚠️ Important:** Save the `api_key` - it's only shown once!

---

## 🔌 WebSocket Events

### Connection

**URL:** `ws://localhost:3000` or `wss://your-domain.com`

**Connect:**
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Events

#### attendance_update

Broadcast when someone taps their card.

**Payload:**
```json
{
  "status": "success",
  "action": "TIME_IN",
  "name": "John Doe",
  "employee_code": "INT-001",
  "time": "2024-02-04T10:30:00.000Z",
  "session": {
    "id": 123,
    "employee_id": 5,
    "full_name": "John Doe",
    "photo_url": "https://..."
  }
}
```

**Subscribe:**
```javascript
socket.on('attendance_update', (data) => {
  console.log('New attendance event:', data);
  // Update UI here
});
```

---

## ⚠️ Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid auth) |
| 404 | Not Found (resource doesn't exist) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 🔒 Rate Limiting

### Tap Endpoint
- **Limit:** 100 requests per minute per device
- **Window:** 60 seconds rolling
- **Cooldown:** 10 seconds between same card taps (configurable)
- **On Exceed:** Returns 429 status

### Other Endpoints
- Currently no rate limiting
- Recommended: Add rate limiting in production

---

## 📝 Examples

### Complete Flow Example (JavaScript)

```javascript
// 1. Admin Login
const loginResponse = await fetch('http://localhost:3000/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

const { token } = await loginResponse.json();

// 2. Get Employees
const employees = await fetch('http://localhost:3000/api/employees', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const employeeList = await employees.json();

// 3. Add New Employee
const newEmployee = await fetch('http://localhost:3000/api/employees', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    full_name: 'Bob Wilson',
    employee_code: 'INT-010',
    role: 'intern'
  })
});

// 4. Subscribe to Real-time Updates
const socket = io('http://localhost:3000');
socket.on('attendance_update', (data) => {
  console.log(`${data.name} just ${data.action}!`);
});
```

### ESP32 Example (Arduino)

```cpp
// In ESP32 code
HTTPClient http;
http.begin(SERVER_URL);
http.addHeader("Content-Type", "application/json");
http.addHeader("X-API-Key", DEVICE_API_KEY);

String payload = "{\"uid\":\"" + uid + "\",\"device_id\":\"main-entrance\"}";
int httpCode = http.POST(payload);

if (httpCode == 200) {
  String response = http.getString();
  Serial.println("Success: " + response);
}
```

---

## 🔧 Configuration

### Environment Variables

Set these in `.env`:

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_system

# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-jwt-key

# Device Settings
DEVICE_TAP_COOLDOWN=10000
TAP_RATE_LIMIT=100
```

### CORS Configuration

By default, CORS allows all origins. In production:

```javascript
// In server.js
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

---

## 📚 Best Practices

1. **Always use HTTPS in production**
2. **Rotate API keys regularly**
3. **Keep JWT_SECRET secure and random**
4. **Backup database before schema changes**
5. **Monitor rate limit violations**
6. **Log all API errors for debugging**
7. **Use environment variables for secrets**
8. **Validate all input data**

---

## 🆘 Common Issues

### Issue: 401 Unauthorized
- Check API key is correct
- Verify JWT token hasn't expired
- Ensure header format is correct

### Issue: 404 Card Not Registered
- Employee needs RFID card assigned
- Check UID matches exactly (case-sensitive)

### Issue: 429 Rate Limited
- Too many requests in short time
- Wait before retrying
- Check for infinite loops in code

---

## 📋 Database Schema

### Key Tables:

**employees**
- id, employee_code, full_name, rfid_uid, role, photo_url, status, created_at, updated_at

**attendance_sessions**
- id, employee_id, date, time_in, time_out, device_in, device_out, duration_minutes, created_at

**devices**
- id, device_id, device_name, api_key, location, status, created_at, last_seen

**admin_users**
- id, username, password_hash, full_name, role, status, created_at, last_login

**audit_logs**
- id, action, user_type, user_id, details, ip_address, created_at

---

Need more help? See the main README.md or SETUP_GUIDE.md
