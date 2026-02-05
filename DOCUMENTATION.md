# 🎓 RFID Attendance System - Complete Documentation

> **Production-ready attendance system with real-time updates, DTR reporting, and beautiful UI**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![Platform](https://img.shields.io/badge/Platform-ESP32-blue)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js-green)]()
[![Database](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-orange)]()

---

## 📑 Table of Contents

1. [System Overview](#-system-overview)
2. [Quick Start](#-quick-start-5-minutes)
3. [Hardware Setup](#-hardware-setup)
4. [Database Setup](#-database-setup-supabase)
5. [Backend Setup](#-backend-setup)
6. [Frontend Setup](#-frontend-setup)
7. [DTR System](#-dtr-daily-time-record-system)
8. [API Documentation](#-api-documentation)
9. [Hardware Wiring](#-hardware-wiring)
10. [Troubleshooting](#-troubleshooting)

---

## 🎯 System Overview

### Features

#### Core Features
- ✅ **One-Tap IN/OUT** - Smart logic determines if it's time in or time out
- ✅ **Real-time Dashboard** - See attendance updates instantly via WebSockets
- ✅ **RFID Card Management** - Easy enrollment system for assigning cards
- ✅ **DTR Reports** - Program-based hours tracking (CpE: 320hrs, IT: 500hrs)
- ✅ **Multi-Device Support** - Manage multiple RFID readers/locations
- ✅ **Photo ID Cards** - Display employee photos for verification
- ✅ **Audit Logs** - Track all system activities

#### Security Features
- Device API key authentication
- Admin JWT authentication
- Rate limiting on tap endpoint
- Duplicate tap prevention (10-second cooldown)
- HTTPS support ready
- Card-employee binding with photos

#### DTR (Daily Time Record) Features
- Program tracking: BS CpE (320 hours) | BS IT (500 hours)
- Weekday-only calculation (Monday-Friday)
- Progress tracking with visual indicators
- Automatic hours calculation
- Starting date: January 28, 2026

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Hardware | ESP32, RC522 RFID Reader |
| IoT Code | Arduino C++ |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Real-time | Socket.IO (WebSockets) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Authentication | JWT, bcrypt |

### Project Structure

```
attendance-system/
├── hardware/
│   ├── esp32-attendance.ino      # ESP32 code for RFID reader
│   ├── README.md                 # Hardware documentation
│   └── WIRING_GUIDE.txt          # Wiring instructions
├── backend/
│   ├── server.js                 # Node.js + Express server
│   ├── package.json              # Dependencies
│   ├── .env                      # Environment variables
│   ├── lib/
│   │   └── supabase-queries.js   # Database query helpers
│   └── migrations/
│       ├── supabase-schema.sql         # Initial database schema
│       ├── add-program-field.sql       # DTR program field migration
│       └── update-dates-to-today.sql   # Date update utility
├── frontend/
│   └── index.html                # Complete dashboard (HTML/CSS/JS)
└── DOCUMENTATION.md              # This file
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- ESP32 board + RC522 RFID reader (~$15)
- Node.js installed (v16+)
- Supabase account (free)
- Arduino IDE (for ESP32)

### Step-by-Step Installation

#### 1. Setup Supabase Database

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the content from `backend/migrations/supabase-schema.sql`
5. Click **Run**
6. Copy and paste the content from `backend/migrations/add-program-field.sql`
7. Click **Run**
8. Go to **Settings** → **API** and copy:
   - Project URL
   - Service role key (secret!)
   - Anon key

#### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file
echo "SUPABASE_URL=https://xxxxx.supabase.co" > .env
echo "SUPABASE_SERVICE_KEY=your-service-key-here" >> .env
echo "SUPABASE_ANON_KEY=your-anon-key-here" >> .env
echo "JWT_SECRET=your-random-secret-here" >> .env
echo "PORT=3000" >> .env
echo "NODE_ENV=development" >> .env

# Start backend
npm start
```

#### 3. Setup Frontend

```bash
# From root directory
npx http-server frontend -p 5173
```

#### 4. Upload ESP32 Code

1. Open `hardware/esp32-attendance.ino` in Arduino IDE
2. Update WiFi credentials and server URL
3. Upload to ESP32
4. Check Serial Monitor for connection status

#### 5. Access Dashboard

- Open: http://localhost:5173
- Login: `admin` / `admin123`
- **Change password immediately!**

---

## 🔌 Hardware Setup

### Shopping List (Budget: ~$15-25)

| Item | Purpose | Cost |
|------|---------|------|
| ESP32 DevKit | Main controller with Wi-Fi | ~$6-8 |
| RC522 RFID Module | Card reader | ~$3-5 |
| MIFARE Classic Cards/Fobs | Employee cards (5-10pcs) | ~$5-8 |
| Jumper Wires (Female-Female) | Connections | ~$2-3 |

### Wiring Diagram

```
RC522 RFID Reader → ESP32
────────────────────────────
SDA/SS    →  GPIO 5
SCK       →  GPIO 18
MOSI      →  GPIO 23
MISO      →  GPIO 19
RST       →  GPIO 22
3.3V      →  3.3V  ⚠️ NOT 5V!
GND       →  GND
```

**⚠️ CRITICAL**: Use **3.3V**, NOT 5V! Using 5V will damage the RC522 module.

### Visual Diagram

```
┌─────────────┐          ┌──────────────┐
│   RC522     │          │    ESP32     │
│   Module    │          │              │
├─────────────┤          ├──────────────┤
│ SDA     ──────────────→ GPIO 5       │
│ SCK     ──────────────→ GPIO 18      │
│ MOSI    ──────────────→ GPIO 23      │
│ MISO    ──────────────→ GPIO 19      │
│ RST     ──────────────→ GPIO 22      │
│ 3.3V    ──────────────→ 3.3V         │
│ GND     ──────────────→ GND          │
└─────────────┘          └──────────────┘
```

---

## 🗄️ Database Setup (Supabase)

### Initial Schema Setup

Run this SQL in Supabase SQL Editor (`backend/migrations/supabase-schema.sql`):

```sql
-- Creates 5 tables:
-- 1. admin_users    - System administrators
-- 2. employees      - Employee records with RFID cards
-- 3. devices        - RFID readers/devices
-- 4. attendance_sessions - Time in/out logs
-- 5. audit_logs     - Activity tracking
```

### DTR Program Field Migration

Run this SQL to add program tracking (`backend/migrations/add-program-field.sql`):

```sql
-- Adds program and required_hours fields
-- Sets up automatic hours calculation based on program
```

### Database Tables

**employees**
```sql
- id (BIGSERIAL)
- employee_code (VARCHAR) - Unique employee identifier
- full_name (VARCHAR)
- rfid_uid (VARCHAR) - RFID card UID (unique)
- role (VARCHAR) - intern, staff, head, admin
- program (VARCHAR) - CpE, IT
- required_hours (INTEGER) - 320 or 500 based on program
- photo_url (VARCHAR)
- status (VARCHAR) - active, inactive
```

**attendance_sessions**
```sql
- id (BIGSERIAL)
- employee_id (BIGINT) - References employees
- date (DATE) - Session date
- time_in (TIMESTAMPTZ)
- time_out (TIMESTAMPTZ)
- device_in (VARCHAR)
- device_out (VARCHAR)
```

---

## ⚙️ Backend Setup

### Environment Variables

Create `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-random-secret-minimum-32-characters

# Device Settings
DEVICE_TAP_COOLDOWN=10000  # 10 seconds in milliseconds
TAP_RATE_LIMIT=100         # Max taps per minute per device

# CORS
CORS_ORIGIN=*              # Change to your domain in production
```

### Running the Backend

```bash
cd backend
npm install
npm start
```

Server runs on http://localhost:3000

---

## 🎨 Frontend Setup

The frontend is a single HTML file with all CSS and JavaScript embedded.

### Running Locally

```bash
# Option 1: Using http-server
npx http-server frontend -p 5173

# Option 2: Using Python
cd frontend
python -m http.server 5173

# Option 3: Open directly
# Open frontend/index.html in browser
# Note: WebSocket may not work with file:// protocol
```

### Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Change this immediately in production!**

---

## 📊 DTR (Daily Time Record) System

### Program Requirements

| Program | Required Hours | Default |
|---------|----------------|---------|
| BS Computer Engineering (CpE) | 320 hours | ✓ |
| BS Information Technology (IT) | 500 hours | |

### How It Works

1. **Date Range**: Default start date is January 28, 2026
2. **Weekdays Only**: Only Monday-Friday attendance counts
3. **Automatic Calculation**: Hours are calculated from time_in to time_out
4. **Progress Tracking**: Visual progress bars show completion status

### Viewing DTR Reports

1. Login to dashboard
2. Click **Reports** tab
3. View summary for all employees
4. Click employee name for detailed daily breakdown

### Adding New Employees with Program

When creating a new employee:

```javascript
{
  "full_name": "Juan Dela Cruz",
  "employee_code": "INT-001",
  "role": "intern",
  "program": "IT"  // or "CpE"
}
```

The system automatically sets:
- `required_hours`: 500 for IT, 320 for CpE

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

**Admin Endpoints**: Require JWT token in Authorization header
```
Authorization: Bearer <jwt_token>
```

**Device Endpoints**: Require API key in header
```
X-API-Key: <device_api_key>
```

### Endpoints

#### 1. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

---

#### 2. Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "role": "admin"
  }
}
```

---

#### 3. RFID Tap (Main Endpoint)
```http
POST /api/tap
X-API-Key: <device_api_key>
Content-Type: application/json

{
  "uid": "AB12CD34",
  "timestamp": "2026-02-05T08:00:00Z"
}
```

**Response (Time In):**
```json
{
  "status": "success",
  "action": "TIME_IN",
  "name": "Juan Dela Cruz",
  "employee_code": "INT-001",
  "time": "2026-02-05T08:00:00.000Z",
  "session": {
    "id": 123,
    "employee_id": 45,
    "date": "2026-02-05",
    "time_in": "2026-02-05T08:00:00.000Z",
    "time_out": null,
    "duration_minutes": null
  }
}
```

**Response (Time Out):**
```json
{
  "status": "success",
  "action": "TIME_OUT",
  "name": "Juan Dela Cruz",
  "employee_code": "INT-001",
  "time": "2026-02-05T17:00:00.000Z",
  "session": {
    "id": 123,
    "employee_id": 45,
    "date": "2026-02-05",
    "time_in": "2026-02-05T08:00:00.000Z",
    "time_out": "2026-02-05T17:00:00.000Z",
    "duration_minutes": 540
  }
}
```

---

#### 4. Get All Employees
```http
GET /api/employees
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "employee_code": "INT-001",
    "full_name": "Juan Dela Cruz",
    "rfid_uid": "AB12CD34",
    "role": "intern",
    "program": "IT",
    "required_hours": 500,
    "photo_url": null,
    "status": "active",
    "created_at": "2026-01-28T00:00:00.000Z"
  }
]
```

---

#### 5. Create Employee
```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Maria Santos",
  "employee_code": "INT-002",
  "role": "intern",
  "program": "CpE"
}
```

**Response:**
```json
{
  "id": 2,
  "full_name": "Maria Santos",
  "employee_code": "INT-002",
  "role": "intern",
  "program": "CpE"
}
```

---

#### 6. Assign RFID Card
```http
POST /api/employees/:id/assign-card
Authorization: Bearer <token>
Content-Type: application/json

{
  "rfid_uid": "EF56GH78"
}
```

**Response:**
```json
{
  "success": true,
  "rfid_uid": "EF56GH78"
}
```

---

#### 7. Get Dashboard Today
```http
GET /api/dashboard/today
Authorization: Bearer <token>
```

**Response:**
```json
{
  "present": 15,
  "total": 50,
  "currently_in": 12,
  "absent": 35,
  "recent_taps": [
    {
      "id": 234,
      "employee_id": 12,
      "full_name": "Pedro Garcia",
      "employee_code": "INT-003",
      "date": "2026-02-05",
      "time_in": "2026-02-05T08:30:00.000Z",
      "time_out": null
    }
  ]
}
```

---

#### 8. Get DTR Summary (All Employees)
```http
GET /api/reports/dtr?startDate=2026-01-28&endDate=2026-02-05
Authorization: Bearer <token>
```

**Response:**
```json
{
  "startDate": "2026-01-28",
  "endDate": "2026-02-05",
  "employees": [
    {
      "id": 1,
      "employee_code": "INT-001",
      "full_name": "Juan Dela Cruz",
      "program": "IT",
      "required_hours": 500,
      "total_hours": 45.5,
      "hours_remaining": 454.5,
      "progress_percentage": "9.10",
      "session_count": 6
    }
  ]
}
```

---

#### 9. Get Employee DTR Details
```http
GET /api/reports/dtr/:employeeId?startDate=2026-01-28&endDate=2026-02-05
Authorization: Bearer <token>
```

**Response:**
```json
{
  "startDate": "2026-01-28",
  "endDate": "2026-02-05",
  "sessions": [
    {
      "id": 123,
      "employee_id": 1,
      "date": "2026-01-28",
      "time_in": "2026-01-28T08:00:00.000Z",
      "time_out": "2026-01-28T17:00:00.000Z",
      "duration_hours": 9,
      "is_weekday": true
    }
  ],
  "totalHours": 45.5,
  "employee": {
    "full_name": "Juan Dela Cruz",
    "employee_code": "INT-001",
    "program": "IT",
    "required_hours": 500
  }
}
```

---

### WebSocket Events

**Event**: `attendance_update`

Emitted when any RFID tap occurs.

**Payload:**
```json
{
  "status": "success",
  "action": "TIME_IN",
  "name": "Juan Dela Cruz",
  "employee_code": "INT-001",
  "time": "2026-02-05T08:00:00.000Z",
  "session": { /* session details */ }
}
```

---

## 🔧 Hardware Wiring

### Detailed Connection Guide

1. **Prepare Components**
   - ESP32 board
   - RC522 RFID module
   - 7 female-to-female jumper wires
   - USB cable for ESP32

2. **Make Connections** (follow exactly):
   - RC522 **SDA** → ESP32 **GPIO 5**
   - RC522 **SCK** → ESP32 **GPIO 18**
   - RC522 **MOSI** → ESP32 **GPIO 23**
   - RC522 **MISO** → ESP32 **GPIO 19**
   - RC522 **RST** → ESP32 **GPIO 22**
   - RC522 **3.3V** → ESP32 **3.3V** (NOT 5V!)
   - RC522 **GND** → ESP32 **GND**

3. **Verify Connections**
   - Double-check each wire
   - Ensure 3.3V connection (critical!)
   - No loose connections

4. **Power Up**
   - Connect ESP32 to computer via USB
   - RC522 LED should light up
   - Upload Arduino code
   - Check Serial Monitor for "Card reader ready"

### Testing

1. Hold an RFID card near the RC522 reader
2. Serial Monitor should display the card UID
3. Card UID should appear in 8-character hex format (e.g., "AB12CD34")

---

## 🔍 Troubleshooting

### Backend Issues

**Issue**: Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Issue**: Cannot connect to Supabase
- Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
- Verify Supabase project is active
- Check internet connection

**Issue**: Authentication fails
- Verify JWT_SECRET is set in .env
- Check admin credentials in database
- Clear browser cookies and try again

---

### Frontend Issues

**Issue**: Dashboard not loading
- Check backend is running on port 3000
- Open browser console (F12) for errors
- Verify CORS is enabled in backend

**Issue**: WebSocket not connecting
- Don't use file:// protocol - use http-server
- Check firewall settings
- Verify Socket.IO is working (check browser console)

**Issue**: Time In/Out not showing
- Check attendance_sessions table has records with today's date
- Run the date update SQL if needed
- Verify timezone settings

---

### Hardware Issues

**Issue**: ESP32 not connecting to WiFi
- Double-check SSID and password in Arduino code
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check WiFi signal strength

**Issue**: RC522 not reading cards
- Verify 3.3V connection (NOT 5V!)
- Check all wire connections
- Hold card closer to reader (within 3cm)
- Try different RFID cards

**Issue**: ESP32 keeps restarting
- Check power supply (use good USB cable)
- Verify RC522 is on 3.3V (5V damages it)
- Check Serial Monitor for error messages

---

## 📝 Default Credentials

### Admin Login
- Username: `admin`
- Password: `admin123`

### Device API Key
Generated when creating a device via dashboard.

---

## 🚀 Production Deployment

### Security Checklist

- [ ] Change admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS
- [ ] Update CORS_ORIGIN to specific domain
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Use environment-specific .env files
- [ ] Rotate device API keys regularly
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging

### Recommended Hosting

- **Backend**: Heroku, Railway, DigitalOcean, AWS EC2
- **Database**: Supabase (already hosted)
- **Frontend**: Netlify, Vercel, GitHub Pages

---

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

---

## 🤝 Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check browser console for errors
4. Verify database connections

---

**Last Updated**: February 5, 2026
**Version**: 2.0.0
**Status**: Production Ready ✅
