# Backend Setup & Deployment Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Full Setup](#full-setup)
3. [Testing](#testing)
4. [Deployment](#deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### For Development (5 minutes)

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies (if not already done)
npm install

# 3. Set up database
npm run migrate

# 4. Start server
npm start
```

**That's it!** Server is running on `http://localhost:3000`

---

## 📝 Full Setup

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** or yarn
- **MySQL** 5.7+ or 8.0+

### Step 1: Configure Environment

```bash
cd backend

# Copy template to .env
cp .env.example .env

# Edit .env with your database credentials
nano .env
# or
code .env
```

**Minimum required:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_system
```

### Step 2: Install Dependencies

```bash
npm install
```

**Installed packages:**
- express - REST API framework
- mysql2 - Database driver
- cors - Cross-Origin Resource Sharing
- socket.io - Real-time WebSocket
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- dotenv - Environment management
- nodemon - Development auto-reload

### Step 3: Initialize Database

```bash
npm run migrate
```

This will:
- Create database (if not exists)
- Create all 5 tables
- Create default admin user (admin/admin123)
- Create sample employee (INT-001)

**⚠️ Important:** Change the default admin password immediately after first login!

### Step 4: Start Server

**Development with auto-reload:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Expected output:**
```
╔════════════════════════════════════════════╗
║   Attendance System Backend Started!      ║
╚════════════════════════════════════════════╝
[✓] Server running on port 3000
[✓] WebSocket server ready
[i] Environment: development

📡 API Endpoints:
  ├─ Public
  │  └─ GET  /api/health - Server health check
  ├─ Authentication
  │  └─ POST /api/admin/login - Admin login
  ... (all endpoints listed)
```

---

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-02-04T10:30:00.000Z"
}
```

### 2. Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "role": "admin"
  }
}
```

**Save the token for other requests!**

### 3. Get Employees
```bash
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create Device
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "device_name": "Main Entrance",
    "location": "Building A, Floor 1"
  }'
```

**Save the api_key from response!**

### 5. Test RFID Tap
```bash
curl -X POST http://localhost:3000/api/tap \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_DEVICE_API_KEY" \
  -d '{"uid":"A1B2C3D4"}'
```

**Note:** Will return 404 if card not registered. First assign a card to an employee.

---

## 🌐 Environment Variables

### Development
```env
# Development Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=attendance_system

# Development Server
PORT=3000
NODE_ENV=development

# Security (change these in production!)
JWT_SECRET=your-secret-key-dev

# Device Settings
DEVICE_TAP_COOLDOWN=10000
TAP_RATE_LIMIT=100

# CORS
CORS_ORIGIN=*
```

### Production
```env
# Production Database
DB_HOST=prod-db-server.com
DB_USER=prod_user
DB_PASSWORD=strong_password_here
DB_NAME=attendance_prod

# Production Server
PORT=3000
NODE_ENV=production

# Security (use strong secrets!)
JWT_SECRET=your-very-long-random-secret-key-here

# Device Settings (adjust as needed)
DEVICE_TAP_COOLDOWN=10000
TAP_RATE_LIMIT=100

# CORS (restrict to your domain)
CORS_ORIGIN=https://yourdomain.com
```

---

## 🚢 Deployment

### Option 1: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "attendance-backend"

# Save PM2 config
pm2 save

# Setup auto-start on reboot
pm2 startup

# View logs
pm2 logs attendance-backend

# Restart
pm2 restart attendance-backend

# Stop
pm2 stop attendance-backend
```

### Option 2: Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t attendance-backend .
docker run -p 3000:3000 --env-file .env attendance-backend
```

### Option 3: Using Systemd (Linux)

Create `/etc/systemd/system/attendance-backend.service`:
```ini
[Unit]
Description=Attendance System Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/attendance-system/backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable attendance-backend
sudo systemctl start attendance-backend
sudo systemctl status attendance-backend
```

### Option 4: Using Nginx Reverse Proxy

```nginx
upstream attendance_backend {
  server localhost:3000;
}

server {
  listen 80;
  server_name api.yourdomain.com;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  # SSL certificates
  ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
  ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

  # Proxy to Node.js
  location / {
    proxy_pass http://attendance_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # WebSocket support
  location /socket.io {
    proxy_pass http://attendance_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

---

## 🔍 Troubleshooting

### MySQL Connection Issues

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql

# Verify credentials in .env
cat .env | grep DB_

# Test connection
mysql -h localhost -u root -p
```

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

### Database Migration Issues

**Error:** `Error: Access denied for user 'root'@'localhost'`

**Solution:**
1. Check .env credentials are correct
2. Verify MySQL user has create database privileges:
   ```sql
   GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Authentication Issues

**Error:** `401 Unauthorized - Invalid API key`

**Solutions:**
1. Verify device API key is correct
2. Check device status is 'active'
3. Ensure X-API-Key header is set correctly

**Error:** `401 Unauthorized - Invalid token`

**Solutions:**
1. Verify JWT token hasn't expired (24h)
2. Check token format: `Authorization: Bearer <token>`
3. Get new token from login endpoint

### Rate Limiting Issues

**Error:** `429 Rate limit exceeded`

**Solutions:**
1. Wait 60 seconds and retry
2. Adjust rate limit in .env:
   ```env
   TAP_RATE_LIMIT=200  # Increase limit
   DEVICE_TAP_COOLDOWN=5000  # Reduce cooldown to 5 seconds
   ```
3. Implement exponential backoff in client code

---

## 📊 Monitoring

### Check Server Health
```bash
curl http://localhost:3000/api/health
```

### View Logs
```bash
# Development
npm run dev  # Logs to console

# Production with PM2
pm2 logs attendance-backend

# Docker
docker logs <container_id>

# Systemd
journalctl -u attendance-backend -f
```

### Monitor Database
```bash
# Connect to MySQL
mysql -u root -p

# Check active connections
SHOW PROCESSLIST;

# View table sizes
SELECT TABLE_NAME, ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size in MB'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'attendance_system';

# Check attendance records
SELECT COUNT(*) FROM attendance_sessions;
SELECT COUNT(DISTINCT DATE(time_in)) FROM attendance_sessions;
```

---

## 🔐 Security Checklist

- [ ] Changed default admin password
- [ ] Generated strong JWT_SECRET (32+ characters)
- [ ] Enabled HTTPS/WSS in production
- [ ] Configured CORS_ORIGIN (not *)
- [ ] Set NODE_ENV=production
- [ ] Enabled database backups
- [ ] Set up rate limiting
- [ ] Review firewall rules
- [ ] Enable MySQL user privileges (least privilege)
- [ ] Monitor audit logs regularly
- [ ] Rotate API keys periodically
- [ ] Enable HTTPS on Nginx reverse proxy

---

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_employee_date ON attendance_sessions(employee_id, date);
CREATE INDEX idx_tap_time ON attendance_sessions(time_in);

-- Check query performance
EXPLAIN SELECT * FROM attendance_sessions WHERE date = CURDATE();
```

### Application Optimization
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Add request timeout
app.use((req, res, next) => {
  res.setTimeout(30000); // 30 seconds
  next();
});
```

### Infrastructure Optimization
- Use connection pooling (already implemented)
- Enable caching headers
- Use CDN for static files
- Monitor database slow queries
- Scale horizontally with load balancer

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## ✅ Deployment Checklist

Before going to production:

- [ ] Environment variables configured (.env)
- [ ] Database backed up
- [ ] Strong JWT_SECRET set
- [ ] CORS_ORIGIN restricted
- [ ] NODE_ENV=production
- [ ] Process manager configured (PM2)
- [ ] Nginx/reverse proxy configured
- [ ] HTTPS/SSL certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring and alerting setup
- [ ] Backup and restore procedures tested
- [ ] Disaster recovery plan in place

---

**Deployment Date:** ___________
**Deployed By:** ___________
**Environment:** ___________

For issues or questions, refer to `API_DOCUMENTATION.md` or `QUICK_REFERENCE.md`.
