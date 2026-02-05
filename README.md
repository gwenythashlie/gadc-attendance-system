# 🎓 Modern RFID Attendance System for Interns

A complete, production-ready attendance system with real-time updates, beautiful UI, and easy setup.

![System Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Platform](https://img.shields.io/badge/Platform-ESP32-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js-green)
![Database](https://img.shields.io/badge/Database-MySQL-orange)

## ✨ Features

### 🎯 Core Features
- ✅ **One-Tap IN/OUT** - Smart logic determines if it's time in or time out
- ✅ **Real-time Dashboard** - See attendance updates instantly via WebSockets
- ✅ **RFID Card Management** - Easy enrollment system for assigning cards
- ✅ **Multi-Device Support** - Manage multiple RFID readers/locations
- ✅ **Photo ID Cards** - Display employee photos for verification
- ✅ **Daily/Monthly Reports** - Export attendance data to CSV/Excel
- ✅ **Audit Logs** - Track all system activities

### 🔒 Security Features
- Device API key authentication
- Admin JWT authentication
- Rate limiting on tap endpoint
- Duplicate tap prevention (10-second cooldown)
- HTTPS support ready
- Card-employee binding with photos

### 💎 User Experience
- Modern, beautiful dashboard with dark theme
- Live activity feed
- Responsive design (works on mobile)
- Zero-refresh updates
- Visual feedback for all actions

## 📁 Project Structure

```
attendance-system/
├── hardware/
│   └── esp32-attendance.ino      # ESP32 code for RFID reader
├── backend/
│   ├── server.js                 # Node.js + Express server
│   ├── package.json              # Dependencies
│   ├── .env.example              # Environment variables template
│   └── migrations/
│       └── setup.js              # Database setup script
├── frontend/
│   └── index.html                # Complete dashboard (HTML/CSS/JS)
├── SETUP_GUIDE.md                # Detailed setup instructions
├── QUICKSTART.md                 # Quick installation guide
└── README.md                     # This file
```

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- ESP32 board + RC522 RFID reader (~$15)
- Node.js installed (v16+)
- MySQL database (local or cloud)
- Arduino IDE (for ESP32)

### Installation

1. **Clone or download this project**

2. **Setup Database**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate
   ```

3. **Start Backend**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

4. **Upload ESP32 Code**
   - Open `hardware/esp32-attendance.ino` in Arduino IDE
   - Update WiFi credentials and server URL
   - Upload to ESP32
   - Check Serial Monitor for connection status

5. **Access Dashboard**
   - Open: `http://localhost:3000/frontend/index.html`
   - Login: `admin` / `admin123`
   - Change password immediately!

📖 **For detailed instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## 🔌 Hardware Wiring

### ESP32 + RC522 Connection

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

**⚠️ CRITICAL**: Use **3.3V**, NOT 5V! Using 5V will damage the RC522 module.

### Visual Diagram

```
┌─────────────┐          ┌──────────────┐
│   RC522     │          │    ESP32     │
│   Module    │          │              │
├─────────────┤          ├──────────────┤
│ SDA     ──────────────→ GPIO 5       │
│ SCK     ──────────────→ GPIO 18      │
│ MOSI    ──────────────→ GPIO 23      │
│ MISO    ──────────────→ GPIO 19      │
│ RST     ──────────────→ GPIO 22      │
│ 3.3V    ──────────────→ 3.3V         │
│ GND     ──────────────→ GND          │
└─────────────┘          └──────────────┘
```

## 🎯 System Architecture

```
┌────────────┐     WiFi      ┌─────────────┐     HTTP/WS    ┌─────────────┐
│   ESP32    │ ─────────────→ │   Backend   │ ─────────────→ │  Dashboard  │
│  + RC522   │               │  (Node.js)  │               │    (Web)    │
└────────────┘               └─────────────┘               └─────────────┘
      ↓                             ↓                             ↑
   Reads UID                  Processes Logic              Real-time Updates
      ↓                             ↓                             ↑
┌────────────┐               ┌─────────────┐                     │
│ RFID Card  │               │    MySQL    │                     │
│  (Employee)│               │  Database   │────────────────────┘
└────────────┘               └─────────────┘
                                   Stores
                              attendance records
```

## 💻 Technology Stack

| Component | Technology |
|-----------|-----------|
| Hardware | ESP32, RC522 RFID Reader |
| IoT Code | Arduino C++ |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0+ |
| Real-time | Socket.IO (WebSockets) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Authentication | JWT, bcrypt |
| API | RESTful |

## 📊 Database Schema

### Main Tables

**employees**
- Store employee info, RFID UID, photos
- Unique constraints on employee_code and rfid_uid

**attendance_sessions**
- Log time_in and time_out for each day
- Auto-calculates duration
- Links to devices used

**devices**
- Manage multiple RFID readers
- Each has unique API key

**audit_logs**
- Track all admin actions
- Card enrollments, employee changes, etc.

## 🎨 Dashboard Features

### Main Dashboard
- **Real-time Stats**: Present, Absent, Currently In, Total
- **Live Activity Feed**: See taps as they happen
- **Visual Feedback**: Color-coded status badges
- **Smooth Animations**: Professional transitions

### Employee Management
- Add/Edit/Deactivate employees
- Upload photos
- Assign employee codes
- Role management (Intern, Staff, Head, Admin)

### RFID Enrollment
- Simple card assignment workflow
- Duplicate prevention
- Visual UID display
- Instant feedback

### Reports & Analytics
- Daily attendance summary
- Export to CSV/Excel
- Filter by date, employee, department
- Late/Early tracking (optional)

## 🔐 Security Best Practices

1. **Change Default Password**
   ```sql
   UPDATE admin_users 
   SET password_hash = '$2a$10$...' 
   WHERE username = 'admin';
   ```

2. **Use HTTPS in Production**
   - Get free SSL from Let's Encrypt
   - Update ESP32 code to use `https://`

3. **Rotate API Keys**
   - Change device API keys periodically
   - Revoke old devices

4. **Backup Database**
   - Daily automated backups
   - Store offsite

5. **Monitor Logs**
   - Check audit_logs regularly
   - Set up alerts for suspicious activity

## 📱 Mobile Support

The dashboard is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

## 🌐 Deployment Options

### Option 1: Railway.app (Recommended for beginners)
- Free tier available
- Auto-deploy from GitHub
- Includes MySQL database
- Easy environment variables

### Option 2: DigitalOcean / AWS / Azure
- More control
- Better for scaling
- Requires server management

### Option 3: On-Premise Server
- Full control
- No cloud costs
- Requires local server hardware

## 🧪 Testing the System

### Test Checklist

- [ ] ESP32 connects to WiFi
- [ ] ESP32 can reach backend API
- [ ] RFID reader detects cards
- [ ] Cards can be enrolled
- [ ] TIME IN works correctly
- [ ] TIME OUT works correctly
- [ ] Dashboard shows real-time updates
- [ ] Multiple devices work independently
- [ ] Reports generate correctly
- [ ] Duplicate tap prevention works

### Test Scenarios

1. **Normal Flow**
   - Employee taps → TIME IN
   - Employee taps again → TIME OUT

2. **Multiple Taps**
   - Quick double-tap → Only first tap counts

3. **Multiple Days**
   - New day → Fresh IN/OUT cycle

4. **Lost Card**
   - Admin can deactivate card
   - Assign new card to employee

## 🆘 Troubleshooting

### ESP32 Issues

**Problem**: Won't upload code
- **Solution**: Hold BOOT button during upload
- Check USB cable (use data cable, not charge-only)

**Problem**: WiFi connection fails
- **Solution**: Check SSID/password
- Ensure 2.4GHz network (not 5GHz)
- Move closer to router

**Problem**: RFID not reading
- **Solution**: Check all 7 wires
- Verify 3.3V connection
- Try different cards

### Backend Issues

**Problem**: Cannot start server
- **Solution**: Check port 3000 is free
- Verify MySQL is running
- Check .env credentials

**Problem**: Database connection failed
- **Solution**: Verify MySQL credentials
- Check database exists
- Test MySQL connection manually

### Frontend Issues

**Problem**: No real-time updates
- **Solution**: Check WebSocket connection (browser console)
- Verify WS_URL in code
- Check firewall settings

**Problem**: Login fails
- **Solution**: Use default admin/admin123
- Check backend is running
- Verify API_URL is correct

## 📈 Future Enhancements

Potential features to add:

- [ ] Email notifications for late arrivals
- [ ] Shift scheduling
- [ ] Overtime calculation
- [ ] Leave management integration
- [ ] Facial recognition (additional verification)
- [ ] Mobile app for employees
- [ ] QR code backup (when RFID fails)
- [ ] Geofencing
- [ ] Multi-language support
- [ ] Dark/Light theme toggle

## 📝 License

MIT License - Free to use for personal and commercial projects

## 🤝 Contributing

This is a complete working system, but improvements are welcome!

Areas for contribution:
- Additional features
- UI improvements
- Bug fixes
- Documentation
- Translations

## 💬 Support

If you encounter issues:

1. Check **SETUP_GUIDE.md** for detailed instructions
2. Read **QUICKSTART.md** for common problems
3. Review the troubleshooting section above
4. Check Serial Monitor for ESP32 errors
5. Check browser console for frontend errors

## 🎓 Learning Resources

### Understanding the Components

**ESP32**
- Microcontroller with WiFi
- Reads RFID cards
- Sends data to server

**RC522**
- RFID reader module
- Reads MIFARE Classic cards
- Communicates via SPI

**Node.js Backend**
- Processes attendance logic
- Manages database
- Broadcasts real-time updates

**WebSockets**
- Enables real-time dashboard
- Push updates to browser
- No page refresh needed

## 🎉 Credits

Built with modern web technologies and best practices for IoT systems.

**Technologies Used**:
- ESP32 + Arduino
- Node.js + Express
- MySQL
- Socket.IO
- Vanilla JavaScript (no frameworks needed!)

---

**Ready to get started?** 

1. Read [QUICKSTART.md](./QUICKSTART.md) for fast setup
2. Or [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions

**Happy tracking!** 🚀#   g a d c - a t t e n d a n c e - s y s t e m  
 