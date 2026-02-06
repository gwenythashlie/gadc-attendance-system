-- Migration: Add attendance tracking fields (late, notes)
-- Run this in Supabase SQL Editor

-- Add is_late column to track late arrivals (after 8:15 AM)
ALTER TABLE attendance_sessions 
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;

-- Add notes column to track attendance notes (lunch break, late arrival, etc.)
ALTER TABLE attendance_sessions 
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Create index for quick late arrival queries
CREATE INDEX IF NOT EXISTS idx_attendance_is_late ON attendance_sessions(is_late) WHERE is_late = TRUE;

-- Verify changes
SELECT id, employee_id, date, time_in, time_out, is_late, notes 
FROM attendance_sessions 
ORDER BY id DESC 
LIMIT 10;
