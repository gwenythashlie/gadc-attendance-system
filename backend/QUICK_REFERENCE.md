# Backend Quick Reference

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run migrate

# 3. Start server
npm start
```

## 📝 Configuration

Create a `.env` file (copy from `.env.example`):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_system
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
```

## 🔑 Default Credentials

```
Username: admin
Password: admin123
⚠️ CHANGE IMMEDIATELY after first login!
```

## 📡 Core Endpoints

### 1. Health Check (No Auth)
```bash
curl http://localhost:3000/api/health
```

### 2. Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response includes: token (save this for other requests)
```

### 3. RFID Tap (Device Auth)
```bash
curl -X POST http://localhost:3000/api/tap \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_DEVICE_API_KEY" \
  -d '{"uid":"A1B2C3D4"}'
```

### 4. Get Employees (Admin Auth)
```bash
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Add Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "full_name": "John Doe",
    "employee_code": "INT-001",
    "role": "intern"
  }'
```

### 6. Assign RFID Card
```bash
curl -X POST http://localhost:3000/api/employees/1/assign-card \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"rfid_uid":"A1B2C3D4"}'
```

### 7. Get Attendance Logs
```bash
# All logs
curl http://localhost:3000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by date
curl "http://localhost:3000/api/attendance?date=2024-02-04" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by employee
curl "http://localhost:3000/api/attendance?employee_id=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Dashboard Summary
```bash
curl http://localhost:3000/api/dashboard/today \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 9. Device Management
```bash
# List devices
curl http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Register new device
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "device_name": "Main Entrance",
    "location": "Building A, Floor 1"
  }'
```

## 🌐 WebSocket Connection

```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});

// Listen for attendance updates
socket.on('attendance_update', (data) => {
  console.log(`${data.name} - ${data.action}`);
  // Update your UI here
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

## 🔐 Authentication Headers

### For Device Endpoints
```
X-API-Key: your-device-api-key-here
```

### For Admin Endpoints
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## ⚡ Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /api/tap | 100 req/min per device |
| Tap cooldown | 10 seconds between same card |
| Other endpoints | No limit (recommended: add in production) |

## 🗄️ Database Tables

```
admin_users
├─ id, username, password_hash, full_name, role, status
├─ created_at, last_login

employees
├─ id, employee_code, full_name, rfid_uid, role
├─ photo_url, status, created_at, updated_at

devices
├─ id, device_id, device_name, api_key, location
├─ status, created_at, last_seen

attendance_sessions
├─ id, employee_id, date, time_in, time_out
├─ device_in, device_out, duration_minutes, created_at

audit_logs
├─ id, action, user_type, user_id, details
├─ ip_address, created_at
```

## 🐛 Troubleshooting

### MySQL Connection Failed
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists (run migration)

### 401 Unauthorized
- Check API key format (X-API-Key header)
- Verify JWT token is valid (hasn't expired)
- Ensure header format: `Authorization: Bearer <token>`

### 404 Card Not Registered
- Employee needs RFID card assigned
- Check UID case sensitivity (stored as uppercase)

### 429 Rate Limited
- Too many requests in short time
- Wait or adjust DEVICE_TAP_COOLDOWN in `.env`

## 📚 Full Documentation

See `API_DOCUMENTATION.md` for complete endpoint reference.

## 🔧 Common Tasks

### Reset Admin Password
1. Stop server
2. Run migration again: `npm run migrate`
3. Default credentials: admin/admin123

### Change JWT Secret (Production)
```env
JWT_SECRET=your-very-long-random-string-here
```
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Add Rate Limiting to Other Endpoints
See commented examples in server.js

### Enable HTTPS/WSS
Use a reverse proxy like Nginx in production

---

**Version:** 1.0.0  
**Last Updated:** February 4, 2024
