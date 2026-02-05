-- Supabase Database Schema for Attendance System
-- Run this in Supabase SQL Editor

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
  program VARCHAR(50) DEFAULT 'CpE' CHECK (program IN ('CpE', 'IT')),
  required_hours INTEGER DEFAULT 320,
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
-- Hash generated using bcrypt with 10 rounds
INSERT INTO admin_users (username, password_hash, full_name, role)
VALUES (
  'admin',
  '$2a$10$Ks5H.v230HLw3GTAQSuK9OlRHhxaAMA2OQWQU/YsPt6zetMOR1Mwe',
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

-- Disable RLS (Row Level Security) for service_role access
-- We're using service_role key from backend, so we don't need RLS
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

COMMIT;
