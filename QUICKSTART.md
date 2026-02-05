# Quick Start Installation Guide

## Step-by-Step Installation

### 1. Install Node.js
Download and install from: https://nodejs.org (LTS version)

Verify installation:
```bash
node --version
npm --version
```

### 2. Install MySQL
Choose one option:

**Option A - XAMPP (Easiest for Windows/Mac)**
- Download from: https://www.apachefriends.org
- Install and start MySQL from XAMPP Control Panel

**Option B - MySQL Installer**
- Download from: https://dev.mysql.com/downloads/installer/
- Install MySQL Server

### 3. Setup Backend

Open terminal in the project folder:

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# On Windows: notepad .env
# On Mac/Linux: nano .env

# Run database migration
npm run migrate

# Start server
npm start
```

You should see:
```
╔════════════════════════════════════════════╗
║   Attendance System Backend Started!      ║
╚════════════════════════════════════════════╝
[✓] Server running on port 3000
```

### 4. Setup ESP32

1. Open `esp32-attendance.ino` in Arduino IDE
2. Update these lines:
   ```cpp
   const char* WIFI_SSID = "YourWiFiName";
   const char* WIFI_PASSWORD = "YourWiFiPassword";
   const char* SERVER_URL = "http://your-computer-ip:3000/api/tap";
   ```
3. To find your computer's IP:
   - Windows: Open CMD → type `ipconfig` → look for IPv4 Address
   - Mac: System Preferences → Network → look for IP address
   - Linux: Open terminal → type `ip addr`

4. Upload code to ESP32
5. Open Serial Monitor (115200 baud)
6. You should see connection messages

### 5. Get Device API Key

1. Open browser: `http://localhost:3000/frontend/index.html`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Go to Settings (if available) or run this SQL:
   ```sql
   INSERT INTO devices (device_id, device_name, api_key, location) 
   VALUES ('main-entrance', 'Main Entrance', 'your-generated-key-here', 'Office');
   ```
4. Copy the API key
5. Update ESP32 code:
   ```cpp
   const char* DEVICE_API_KEY = "your-api-key-here";
   ```
6. Re-upload to ESP32

### 6. Test the System

1. Add an employee via the dashboard
2. Tap an RFID card on the reader
3. Watch the Serial Monitor - you should see the UID
4. Assign that UID to the employee
5. Tap again - it should show TIME IN!
6. Watch the dashboard update in real-time

## Troubleshooting

### ESP32 won't connect to WiFi
- Check SSID and password are correct
- Make sure WiFi is 2.4GHz (not 5GHz)
- Move ESP32 closer to router

### "Cannot connect to database"
- Verify MySQL is running
- Check .env credentials match your MySQL setup
- Try connecting to MySQL manually to test

### RFID reader not working
- Double-check wiring
- Ensure you're using 3.3V NOT 5V
- Test with Serial Monitor - should show "Waiting for cards"

### Dashboard not updating
- Check WebSocket connection in browser console (F12)
- Verify server is running
- Check no firewall blocking port 3000

## Default Login
- Username: `admin`
- Password: `admin123`
- **⚠️ CHANGE THIS IMMEDIATELY!**

## Next Steps
1. Change admin password
2. Add all interns
3. Print ID cards
4. Enroll RFID cards
5. Start tracking!

## Support
If you get stuck, check:
1. Serial Monitor for ESP32 errors
2. Terminal for backend errors  
3. Browser Console (F12) for frontend errors

Good luck! 🚀