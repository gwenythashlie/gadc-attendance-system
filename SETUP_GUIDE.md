# 🎓 Modern Intern Attendance System - Complete Setup Guide

## 📦 What You'll Build

A real-time RFID attendance system with:
- **Hardware**: ESP32 + RC522 RFID reader
- **Backend**: Node.js + MySQL + WebSockets
- **Frontend**: Modern web dashboard with live updates
- **Features**: One-tap IN/OUT, real-time monitoring, employee management

---

## 🛠️ Part 1: Hardware Setup

### Shopping List (Budget: ~$15-25)

| Item | Purpose | Cost |
|------|---------|------|
| ESP32 DevKit | Main controller with Wi-Fi | ~$6-8 |
| RC522 RFID Module | Card reader | ~$3-5 |
| MIFARE Classic Cards/Fobs | Employee cards (5-10pcs) | ~$5-8 |
| Jumper Wires (Female-Female) | Connections | ~$2-3 |

### Wiring Diagram

```
RC522 RFID Reader → ESP32
────────────────────────────
SDA/SS    →  GPIO 5
SCK       →  GPIO 18
MOSI      →  GPIO 23
MISO      →  GPIO 19
RST       →  GPIO 22
3.3V      →  3.3V  ⚠️ NOT 5V!
GND       →  GND
```

**⚠️ CRITICAL**: Use **3.3V**, NOT 5V! RC522 will be damaged by 5V.

### Physical Assembly Steps

1. **Lay out your ESP32** on a breadboard (optional, makes it stable)
2. **Connect the 7 wires** following the diagram above
3. **Double-check**:
   - All connections are firm
   - 3.3V is connected (NOT 5V)
   - No loose wires
4. **Plug ESP32 into USB** - the power LED should light up

---

## 💻 Part 2: ESP32 Code Setup

### Install Arduino IDE

1. Download from: https://www.arduino.cc/en/software
2. Install and open it

### Configure ESP32 in Arduino IDE

1. Go to **File → Preferences**
2. In "Additional Board Manager URLs", add:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Go to **Tools → Board → Boards Manager**
4. Search "esp32" and install **"esp32 by Espressif Systems"**
5. Select board: **Tools → Board → ESP32 Dev Module**

### Install Required Libraries

1. Go to **Sketch → Include Library → Manage Libraries**
2. Install these:
   - **MFRC522** by GithubCommunity
   - **ArduinoJson** by Benoit Blanchon
   - **WiFiManager** by tzapu (optional, makes Wi-Fi setup easier)

### Upload the ESP32 Code

1. Open `esp32-attendance.ino` (I'll provide this file)
2. Update your Wi-Fi credentials in the code
3. Update your server URL
4. Click **Upload** (→ button)
5. Wait for "Done uploading"
6. Open **Serial Monitor** (Tools → Serial Monitor, set to 115200 baud)
7. You should see connection messages

---

## 🌐 Part 3: Backend Setup

### Prerequisites

- Node.js installed (download from nodejs.org)
- MySQL database (I'll show you easy cloud options)

### Database Options (Choose One)

**Option A: Free Cloud Database (Easiest)**
- **Railway.app**: Free tier, auto-setup
- **PlanetScale**: Free tier, good for learning
- **Clever Cloud**: Free MySQL tier

**Option B: Local MySQL**
- Install XAMPP (Windows) or MAMP (Mac)
- Includes MySQL + phpMyAdmin

### Backend Installation

1. **Extract the backend folder** I'll provide
2. **Open terminal** in that folder
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Fill in your database credentials
   - Set a secure API key for devices

5. **Run database migrations**:
   ```bash
   npm run migrate
   ```

6. **Start the server**:
   ```bash
   npm start
   ```

Server runs on: `http://localhost:3000`

### Deploy Backend (Optional but Recommended)

**Using Railway (Free)**:
1. Create account at railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repo
4. Add MySQL plugin
5. Set environment variables
6. Deploy!

Railway gives you: `https://your-app.railway.app`

---

## 🎨 Part 4: Frontend Dashboard

### Run Locally

1. The frontend is in `/frontend` folder
2. Open `index.html` in any modern browser
3. Or use a simple server:
   ```bash
   npx serve frontend
   ```

### Configure API Connection

Edit `frontend/config.js`:
```javascript
const API_URL = 'http://localhost:3000'; // or your Railway URL
const WS_URL = 'ws://localhost:3000';    // or wss://your-app.railway.app
```

---

## 🔐 Part 5: First Setup Walkthrough

### Step 1: Create Admin Account

Open browser: `http://localhost:3000/setup`

Create your admin account.

### Step 2: Add a Device

1. Go to **Settings → Devices**
2. Click "Add Device"
3. Name: "Main Entrance"
4. Copy the generated API key
5. Paste this key in your ESP32 code (`DEVICE_API_KEY`)
6. Re-upload ESP32 code

### Step 3: Add Employees

1. Go to **Employees → Add Employee**
2. Fill in:
   - Full Name
   - Employee Code (e.g., INT-001)
   - Role: Intern
   - Upload photo (optional but recommended)

### Step 4: Enroll RFID Cards

1. Go to **Enrollment** page
2. Select an employee
3. Click "Start Enrollment"
4. **Tap the RFID card** on the reader
5. The UID appears automatically
6. Click "Assign Card"
7. Done! Card is now linked to that employee

### Step 5: Test Attendance

1. Open **Dashboard**
2. Have an intern **tap their card**
3. Watch it appear in real-time! 🎉
4. First tap = TIME IN
5. Second tap = TIME OUT

---

## 📱 System Flow

```
[Employee] → Taps RFID Card
              ↓
         [ESP32 Reader]
              ↓
      Reads card UID
              ↓
    Sends to Backend API
              ↓
   [Backend Logic Decides]
   • TIME IN or TIME OUT?
   • Validates employee
   • Logs to database
              ↓
    [WebSocket Broadcast]
              ↓
  [Dashboard Updates Live]
   • Admin sees it instantly
   • No refresh needed!
```

---

## 🎯 Features Included

### For Admins
- ✅ Real-time attendance dashboard
- ✅ Live feed of all taps
- ✅ Employee management (add/edit/deactivate)
- ✅ RFID card enrollment system
- ✅ Daily/weekly/monthly reports
- ✅ Export to CSV/Excel
- ✅ Device management
- ✅ Audit logs

### For Employees (Optional)
- ✅ Personal attendance history
- ✅ Current status (IN/OUT)
- ✅ Monthly summary

### Security Features
- ✅ Device API keys
- ✅ HTTPS support
- ✅ Rate limiting
- ✅ Duplicate tap prevention (10-second cooldown)
- ✅ Card-person mapping with photos

---

## 🔧 Troubleshooting

### ESP32 won't upload code
- Check USB cable (use data cable, not charge-only)
- Hold BOOT button while uploading
- Select correct port: Tools → Port

### RFID not reading cards
- Check all 7 wire connections
- Verify 3.3V (NOT 5V!)
- Open Serial Monitor - should show "Scan PICC to see UID"
- Try different cards

### Backend won't start
- Check MySQL is running
- Verify .env credentials
- Run: `npm install` again
- Check port 3000 isn't already in use

### Dashboard not updating live
- Check WebSocket connection in browser console
- Verify WS_URL in config.js
- Check firewall isn't blocking WebSocket

---

## 📊 Database Structure

The system uses 4 main tables:

1. **employees** - Store employee info + RFID UID
2. **attendance_sessions** - Log all time IN/OUT
3. **devices** - Manage multiple RFID readers
4. **audit_logs** - Track all admin actions

---

## 🚀 Next Steps

After basic setup:

1. **Print ID Cards** with photos
2. **Add more devices** for multiple entrances
3. **Set up daily reports** (email automation)
4. **Add shift rules** (late/early detection)
5. **Implement overtime tracking**
6. **Add mobile view** for employees

---

## 💡 Tips for Real Deployment

1. **Use HTTPS** - Get free SSL from Let's Encrypt
2. **Backup database daily** - Automated backups
3. **Monitor uptime** - Use UptimeRobot (free)
4. **Add cameras** at entry points (optional, for verification)
5. **Regular card audits** - Check for lost/stolen cards
6. **Keep logs** for at least 1 year (compliance)

---

## 📞 Need Help?

If something's not working:
1. Check the Serial Monitor for ESP32 errors
2. Check backend console logs
3. Check browser console (F12) for frontend errors
4. Review the wiring diagram again

---

**Ready to build? Let's start with the code files!** 🎉