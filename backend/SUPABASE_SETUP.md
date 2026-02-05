# 🚀 Supabase Setup Guide

Complete guide to set up and configure Supabase for the Attendance System.

---

## 📋 Prerequisites

- Supabase account (free tier available at https://supabase.com)
- Node.js 16+ installed
- Basic SQL knowledge

---

## 🔧 Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name:** attendance-system
   - **Database Password:** (save this securely!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier is sufficient
5. Wait 2-3 minutes for project creation

---

## 🔑 Step 2: Get API Keys

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (for client-side, if needed)
   - **service_role key** (for backend - keep this secret!)

---

## 📝 Step 3: Configure Environment Variables

1. In the `backend/` folder, create `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this

# Device Settings
DEVICE_TAP_COOLDOWN=10000
TAP_RATE_LIMIT=100

# CORS Configuration
CORS_ORIGIN=*
```

2. Replace:
   - `SUPABASE_URL` with your Project URL
   - `SUPABASE_SERVICE_KEY` with your service_role key
   - `SUPABASE_ANON_KEY` with your anon key
   - `JWT_SECRET` with a strong random string

---

## 🗄️ Step 4: Create Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy and paste the SQL below
4. Click **Run** (or press Ctrl+Enter)

```sql
-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'hr', 'viewer')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ NULL
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  rfid_uid VARCHAR(50) UNIQUE NULL,
  role VARCHAR(20) DEFAULT 'intern' CHECK (role IN ('intern', 'staff', 'head', 'admin')),
  photo_url VARCHAR(255) NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  location VARCHAR(100) NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ NULL
);

-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_in TIMESTAMPTZ NOT NULL,
  time_out TIMESTAMPTZ NULL,
  device_in BIGINT NULL REFERENCES devices(id) ON DELETE SET NULL,
  device_out BIGINT NULL REFERENCES devices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'device', 'system')),
  user_id BIGINT NULL,
  details JSONB NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_rfid ON employees(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_sessions(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employees table
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, full_name, role)
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere',  -- You'll need to generate this
  'System Administrator',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- Insert sample employee (optional)
INSERT INTO employees (employee_code, full_name, role)
VALUES (
  'INT-001',
  'Sample Intern',
  'intern'
)
ON CONFLICT (employee_code) DO NOTHING;

COMMIT;
```

### Option B: Using Migration Script

Run the migration script (after updating it for Supabase):

```bash
cd backend
npm run migrate
```

---

## 🔐 Step 5: Create Default Admin Password

The default admin password needs to be hashed. Run this in Node.js:

```javascript
const bcrypt = require('bcryptjs');
const password = 'admin123';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

Or use this online tool (for testing only):
https://bcrypt-generator.com/

Then update the admin_users INSERT statement with the generated hash.

---

## 🔒 Step 6: Configure Row Level Security (RLS) - Optional

For added security, enable RLS in Supabase:

1. Go to **Authentication** → **Policies**
2. For each table, you can create policies

**For now, disable RLS** since we're using service_role key:

```sql
-- Disable RLS (we're using service role key for backend)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
```

---

## 📦 Step 7: Install Dependencies

```bash
cd backend
npm install
```

This will install `@supabase/supabase-js` and other dependencies.

---

## 🚀 Step 8: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

---

## ✅ Step 9: Test the Connection

### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T..."
}
```

### Test 2: Admin Login

First, make sure you have the admin user in Supabase:

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Should return a JWT token.

---

## 🔧 Troubleshooting

### Issue: "Invalid API key"

**Solution:**
- Check `SUPABASE_SERVICE_KEY` in `.env`
- Make sure it's the **service_role** key, not anon key
- No extra spaces or quotes

### Issue: "relation 'employees' does not exist"

**Solution:**
- Run the SQL schema in Step 4
- Check table names are lowercase
- Verify in Supabase **Table Editor**

### Issue: "authentication required"

**Solution:**
- Check `SUPABASE_URL` is correct
- Verify service_role key has full permissions
- Make sure RLS is disabled for service_role operations

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
npm install @supabase/supabase-js
```

---

## 📊 Verify Database Setup

1. Go to **Table Editor** in Supabase
2. You should see 5 tables:
   - admin_users
   - employees
   - devices
   - attendance_sessions
   - audit_logs

3. Click on each table to verify structure

---

## 🎓 Supabase Features Available

Now that you're using Supabase, you can leverage:

- ✅ **Real-time subscriptions** - Listen to database changes
- ✅ **PostgreSQL** - More advanced queries and features
- ✅ **Built-in Auth** - Optional Supabase Auth (instead of JWT)
- ✅ **Storage** - For employee photos
- ✅ **Edge Functions** - Serverless functions
- ✅ **Auto-generated REST API** - Direct table access (if needed)

---

## 🔄 Migration from MySQL

If you had data in MySQL:

1. Export MySQL data to CSV
2. Go to Supabase **Table Editor**
3. Click **Import data** for each table
4. Upload CSV files

Or use this SQL to import:

```sql
COPY employees(employee_code, full_name, rfid_uid, role, photo_url, status)
FROM '/path/to/employees.csv'
DELIMITER ','
CSV HEADER;
```

---

## 📚 Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure `.env` file
3. ✅ Run SQL schema
4. ✅ Create admin user
5. ✅ Test API endpoints
6. Consider using Supabase Storage for photos
7. Explore Supabase Real-time features
8. Set up database backups (automatic in Supabase)

---

## 🔗 Useful Links

- Supabase Dashboard: https://app.supabase.com
- Supabase Docs: https://supabase.com/docs
- JavaScript Client Docs: https://supabase.com/docs/reference/javascript
- SQL Editor: In your project dashboard

---

## ⚠️ Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Keep service_role key secret** - Only use on backend
3. **Use anon key for frontend** - If building client app
4. **Rotate keys regularly** - In production
5. **Enable RLS** - When using client-side access
6. **Use strong JWT_SECRET** - Generate random string
7. **Regular backups** - Supabase does this automatically

---

## 🎉 You're All Set!

Your backend now uses Supabase PostgreSQL instead of MySQL!

- More scalable
- Built-in features
- Better developer experience
- Free tier available

Test all endpoints to ensure everything works correctly.

---

**Need Help?**

- Check Supabase docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check backend logs for errors

**Status:** Ready for Supabase! 🚀
