-- Update attendance_sessions dates to today (2026-02-05)
-- Run this in Supabase SQL Editor

-- Update all attendance records to today's date
UPDATE attendance_sessions 
SET date = '2026-02-05'
WHERE date < '2026-02-05';

-- Verify the changes
SELECT id, employee_id, date, time_in, time_out 
FROM attendance_sessions 
ORDER BY id DESC 
LIMIT 20;
