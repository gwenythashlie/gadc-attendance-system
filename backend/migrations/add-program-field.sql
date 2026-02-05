-- Migration: Add program and required_hours fields to employees table
-- Run this in Supabase SQL Editor

-- Add program column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS program VARCHAR(50) DEFAULT 'CpE' CHECK (program IN ('CpE', 'IT'));

-- Add required_hours column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS required_hours INTEGER DEFAULT 320;

-- Update required_hours based on program for existing records
UPDATE employees 
SET required_hours = CASE 
  WHEN program = 'IT' THEN 500 
  ELSE 320 
END;

-- Create or replace trigger to auto-set required_hours based on program
CREATE OR REPLACE FUNCTION set_required_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.program = 'IT' THEN
    NEW.required_hours := 500;
  ELSIF NEW.program = 'CpE' THEN
    NEW.required_hours := 320;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_required_hours ON employees;
CREATE TRIGGER trigger_set_required_hours
BEFORE INSERT OR UPDATE OF program ON employees
FOR EACH ROW
EXECUTE FUNCTION set_required_hours();

-- Verify changes
SELECT id, employee_code, full_name, program, required_hours FROM employees;
