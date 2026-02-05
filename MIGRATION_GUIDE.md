# 🔄 MySQL to Supabase Migration Guide

## Quick Migration Summary

Your backend has been updated to use **Supabase (PostgreSQL)** instead of MySQL!

---

## ✅ What Was Changed

### 1. Package Dependencies
- ✅ Removed: `mysql2`
- ✅ Added: `@supabase/supabase-js`

### 2. Configuration (.env)
- ✅ Removed: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- ✅ Added: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`

### 3. Database Connection
- ✅ Replaced MySQL connection pool with Supabase client
- ✅ Using service_role key for full database access

### 4. Query Syntax
- ✅ Converted SQL queries to Supabase PostgREST API calls
- ✅ Created helper functions in `lib/supabase-queries.js`

---

## 📋 Migration Steps

### Step 1: Set Up Supabase Project

1. Go to https://supabase.com and create account
2. Create new project
3. Wait for project setup (2-3 minutes)
4. Get your credentials from Settings → API

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

This installs `@supabase/supabase-js`.

### Step 3: Configure Environment

Create `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key

# Device Settings
DEVICE_TAP_COOLDOWN=10000
TAP_RATE_LIMIT=100

# CORS Configuration
CORS_ORIGIN=*
```

### Step 4: Create Database Schema

1. Go to Supabase **SQL Editor**
2. Run the SQL from `migrations/supabase-schema.sql`
3. Verify tables in **Table Editor**

### Step 5: Generate Admin Password

```bash
node migrations/generate-admin-password.js admin123
```

Copy the generated SQL and run it in Supabase SQL Editor.

### Step 6: Update Server Code

The server code needs to be updated to use Supabase queries instead of MySQL queries. Here are the key changes:

#### Before (MySQL):
```javascript
const [employees] = await pool.query(
  'SELECT * FROM employees WHERE rfid_uid = ?',
  [uid]
);
```

#### After (Supabase):
```javascript
const employee = await db.getEmployeeByRFID(supabase, uid);
```

### Step 7: Test the API

```bash
# Start server
npm start

# Test health
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🔧 Code Changes Required

### Main server.js Changes:

1. **Import Supabase client:**
```javascript
const { createClient } = require('@supabase/supabase-js');
const db = require('./lib/supabase-queries');
```

2. **Initialize Supabase:**
```javascript
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
```

3. **Update all database queries:**

Use the helper functions from `lib/supabase-queries.js`:

- `db.getEmployeeByRFID(supabase, uid)`
- `db.getTodaySession(supabase, employeeId, today)`
- `db.createSession(supabase, employeeId, today, deviceId)`
- `db.updateSessionTimeOut(supabase, sessionId, deviceId)`
- `db.getSessionWithDetails(supabase, sessionId)`
- `db.getAdminByUsername(supabase, username)`
- `db.getAllEmployees(supabase)`
- `db.createEmployee(supabase, employeeData)`
- `db.checkRFIDExists(supabase, rfidUid, excludeId)`
- `db.assignRFIDCard(supabase, employeeId, rfidUid)`
- `db.getAttendanceLogs(supabase, filters)`
- `db.getDashboardStats(supabase, today)`
- `db.getAllDevices(supabase)`
- `db.createDevice(supabase, name, location, apiKey, deviceId)`
- `db.createAuditLog(supabase, action, userType, userId, details)`

---

## 📊 Database Differences

### MySQL → PostgreSQL Changes:

| Feature | MySQL | PostgreSQL/Supabase |
|---------|-------|---------------------|
| Auto Increment | AUTO_INCREMENT | BIGSERIAL |
| Enum | ENUM('a','b') | CHECK (col IN ('a','b')) |
| Timestamp | TIMESTAMP | TIMESTAMPTZ |
| NOW() | NOW() | NOW() or new Date().toISOString() |
| TIMESTAMPDIFF | TIMESTAMPDIFF | Client-side calculation |
| INSERT ID | result.insertId | RETURNING clause |
| Quotes | Backticks ` | Double quotes " |

---

## ✨ Benefits of Supabase

1. ✅ **No server setup** - Fully managed PostgreSQL
2. ✅ **Real-time** - Built-in real-time subscriptions
3. ✅ **Storage** - Built-in file storage for photos
4. ✅ **Auth** - Optional built-in authentication
5. ✅ **Auto API** - REST and GraphQL APIs generated
6. ✅ **Dashboard** - Beautiful admin interface
7. ✅ **Backups** - Automatic daily backups
8. ✅ **Scaling** - Easy to scale
9. ✅ **Free tier** - Generous free tier

---

## 🔄 Query Migration Examples

### Example 1: Get Employee by RFID

**MySQL:**
```javascript
const [employees] = await pool.query(
  'SELECT * FROM employees WHERE rfid_uid = ? AND status = "active"',
  [uid]
);
const employee = employees[0];
```

**Supabase:**
```javascript
const { data: employee, error } = await supabase
  .from('employees')
  .select('*')
  .eq('rfid_uid', uid)
  .eq('status', 'active')
  .single();
```

### Example 2: Create Attendance Session

**MySQL:**
```javascript
const [result] = await pool.query(
  'INSERT INTO attendance_sessions (employee_id, date, time_in, device_in) VALUES (?, ?, NOW(), ?)',
  [employeeId, today, deviceId]
);
const sessionId = result.insertId;
```

**Supabase:**
```javascript
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

const sessionId = data.id;
```

### Example 3: Join Query

**MySQL:**
```javascript
const [results] = await pool.query(`
  SELECT s.*, e.full_name, e.employee_code
  FROM attendance_sessions s
  JOIN employees e ON s.employee_id = e.id
  WHERE s.id = ?
`, [sessionId]);
```

**Supabase:**
```javascript
const { data, error } = await supabase
  .from('attendance_sessions')
  .select(`
    *,
    employee:employees(full_name, employee_code)
  `)
  .eq('id', sessionId)
  .single();
```

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid API key"
**Solution:** Check you're using `SUPABASE_SERVICE_KEY` (not anon key)

### Issue: "relation 'table_name' does not exist"
**Solution:** Run the SQL schema in Supabase SQL Editor

### Issue: "Cannot find module '@supabase/supabase-js'"
**Solution:** Run `npm install`

### Issue: "Row Level Security"  
**Solution:** Disable RLS or use service_role key (already done in schema)

---

## 🎯 Next Steps

1. ✅ Install Supabase client: `npm install`
2. ✅ Create Supabase project
3. ✅ Run SQL schema in Supabase SQL Editor
4. ✅ Update `.env` with Supabase credentials
5. ✅ Generate admin password hash
6. ✅ Test endpoints
7. Consider using Supabase Storage for employee photos
8. Explore Supabase Real-time for live updates

---

## 📚 Resources

- **Supabase Setup Guide:** `SUPABASE_SETUP.md`
- **Query Helpers:** `lib/supabase-queries.js`
- **SQL Schema:** `migrations/supabase-schema.sql`
- **Supabase Docs:** https://supabase.com/docs
- **JavaScript Client:** https://supabase.com/docs/reference/javascript

---

**Status:** Ready for Supabase migration! 🚀

Follow the steps above to complete the migration from MySQL to Supabase.
