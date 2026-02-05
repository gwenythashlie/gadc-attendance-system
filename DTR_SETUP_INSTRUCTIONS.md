# DTR (Daily Time Record) Setup Instructions

## ✅ What's Been Updated

I've added a complete DTR reporting system with:
- **Program tracking**: BS Computer Engineering (CpE) - 320 hours | BS Information Technology (IT) - 500 hours
- **Hours calculation**: Automatic tracking of completed hours for each employee
- **Weekdays only**: System only counts weekday attendance (Monday-Friday)
- **Progress tracking**: Visual progress bars and completion status
- **Starting date**: January 28, 2026 as the default internship start date

## 📋 Step 1: Update Database (REQUIRED)

You need to add the new fields to your Supabase database:

1. **Go to Supabase**: https://fxowjoblzrnyqmctyvct.supabase.co
2. **Open SQL Editor**: Click "SQL Editor" in the left sidebar
3. **Run this migration**:

```sql
-- Migration: Add program and required_hours fields to employees table

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

-- Create trigger to auto-set required_hours based on program
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
```

4. **Click "Run"** to execute the migration

## 📊 Step 2: Access DTR Reports

1. **Open the web dashboard**: http://localhost:3000
2. **Login**: admin / admin123
3. **Click "Reports" tab**
4. **View the DTR**:
   - Default start date: January 28, 2026
   - Default end date: Today
   - Click "Generate Report" to refresh

## 🎯 Step 3: Add New Employees with Program

When adding new employees:

1. Click **"+ Add Employee"**
2. Fill in:
   - Full Name
   - Employee Code
   - Role
   - **Program** (NEW):
     - BS Computer Engineering (320 hrs)
     - BS Information Technology (500 hrs)
3. The system will automatically set required hours based on program selection

## 📈 What You'll See in DTR Report

The DTR report shows:

| Column | Description |
|--------|-------------|
| **Employee Code** | Unique identifier (e.g., INT-001) |
| **Full Name** | Employee's name |
| **Program** | BS CpE or BS IT badge |
| **Hours Completed** | Total hours worked (weekdays only) |
| **Required Hours** | 320 for CpE, 500 for IT |
| **Remaining** | Hours left to complete |
| **Progress** | Visual progress bar with percentage |
| **Days** | Number of attendance days |

### Summary Stats:
- Total Employees
- Completed (reached required hours)
- In Progress (still accumulating hours)

## 🔧 How It Works

1. **Time Calculation**: 
   - System calculates `time_out - time_in` for each session
   - Only counts **weekdays** (Monday-Friday)
   - Automatically sums all hours from start date

2. **Program Assignment**:
   - CpE students: 320 hours required
   - IT students: 500 hours required
   - Auto-updates when you change program

3. **Progress Tracking**:
   - Green: 100% complete
   - Blue: 75-99% complete
   - Orange: 50-74% complete
   - Purple: 0-49% complete

## ⚠️ Important Notes

- **Weekends excluded**: Saturday and Sunday attendance is NOT counted
- **Start date**: Default is Jan 28, 2026 - you can change this in the report filter
- **Real-time**: Hours update automatically as employees tap in/out
- **Complete status**: Shows "COMPLETE ✓" when required hours reached

## 🔄 Update Existing Employees

To update existing employees' programs:

1. Go to **Supabase** → **Table Editor** → **employees**
2. Find the employee row
3. Edit the **program** column: `CpE` or `IT`
4. The **required_hours** will auto-update via trigger

Or run SQL:
```sql
-- Update specific employee
UPDATE employees 
SET program = 'IT' 
WHERE employee_code = 'INT-001';

-- Update all interns to IT
UPDATE employees 
SET program = 'IT' 
WHERE role = 'intern';
```

## 🎉 You're All Set!

After running the migration, your system will:
- ✅ Track program (CpE/IT) for each employee
- ✅ Show required hours based on program
- ✅ Calculate total hours from weekdays only
- ✅ Display beautiful DTR reports with progress tracking
- ✅ Start counting from January 28, 2026

Navigate to **Reports** tab to see it in action!
