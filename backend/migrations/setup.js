// migrations/setup.js - Database Setup Script
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Database Migration - Starting...         ║');
  console.log('╚════════════════════════════════════════════╝\n');

  let connection;

  try {
    // Connect without database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('[✓] Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'attendance_system';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`[✓] Database '${dbName}' ready`);

    await connection.query(`USE ${dbName}`);

    // Create admin_users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'hr', 'viewer') DEFAULT 'admin',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `);
    console.log('[✓] Table: admin_users');

    // Create employees table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_code VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        rfid_uid VARCHAR(50) UNIQUE NULL,
        role ENUM('intern', 'staff', 'head', 'admin') DEFAULT 'intern',
        photo_url VARCHAR(255) NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rfid (rfid_uid),
        INDEX idx_status (status)
      )
    `);
    console.log('[✓] Table: employees');

    // Create devices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id INT PRIMARY KEY AUTO_INCREMENT,
        device_id VARCHAR(50) UNIQUE NOT NULL,
        device_name VARCHAR(100) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        location VARCHAR(100) NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP NULL
      )
    `);
    console.log('[✓] Table: devices');

    // Create attendance_sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        time_in DATETIME NOT NULL,
        time_out DATETIME NULL,
        device_in INT NULL,
        device_out INT NULL,
        duration_minutes INT GENERATED ALWAYS AS (
          CASE 
            WHEN time_out IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, time_in, time_out)
            ELSE NULL
          END
        ) STORED,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (device_in) REFERENCES devices(id) ON DELETE SET NULL,
        FOREIGN KEY (device_out) REFERENCES devices(id) ON DELETE SET NULL,
        INDEX idx_employee_date (employee_id, date),
        INDEX idx_date (date)
      )
    `);
    console.log('[✓] Table: attendance_sessions');

    // Create audit_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        action VARCHAR(50) NOT NULL,
        user_type ENUM('admin', 'device', 'system') NOT NULL,
        user_id INT NULL,
        details JSON NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_action (action),
        INDEX idx_created (created_at)
      )
    `);
    console.log('[✓] Table: audit_logs');

    // Create default admin user
    const [existingAdmin] = await connection.query(
      'SELECT * FROM admin_users WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length === 0) {
      const defaultPassword = 'admin123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await connection.query(
        'INSERT INTO admin_users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        ['admin', passwordHash, 'System Administrator', 'admin']
      );

      console.log('\n[✓] Default admin created:');
      console.log('    Username: admin');
      console.log('    Password: admin123');
      console.log('    ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!\n');
    } else {
      console.log('\n[i] Admin user already exists\n');
    }

    // Create sample employee (optional)
    const [existingEmployee] = await connection.query(
      'SELECT * FROM employees WHERE employee_code = ?',
      ['INT-001']
    );

    if (existingEmployee.length === 0) {
      await connection.query(
        'INSERT INTO employees (employee_code, full_name, role) VALUES (?, ?, ?)',
        ['INT-001', 'Sample Intern', 'intern']
      );
      console.log('[✓] Sample employee created (INT-001)');
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   Migration Completed Successfully!        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log('Next steps:');
    console.log('1. Copy .env.example to .env and configure');
    console.log('2. Run: npm start');
    console.log('3. Login with admin/admin123');
    console.log('4. Change admin password immediately!\n');

  } catch (error) {
    console.error('\n[✗] Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Check MySQL is running');
    console.error('- Verify .env credentials');
    console.error('- Ensure database user has CREATE privileges');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();