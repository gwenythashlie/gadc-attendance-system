# 🎓 RFID Attendance System

> **Complete documentation is now available in [DOCUMENTATION.md](DOCUMENTATION.md)**

A production-ready attendance system with real-time updates, DTR reporting, and beautiful UI.

![System Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Platform](https://img.shields.io/badge/Platform-ESP32-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js-green)
![Database](https://img.shields.io/badge/Database-Supabase-orange)

## 📚 Quick Links

- **[Complete Documentation](DOCUMENTATION.md)** - Full setup guide, API docs, troubleshooting
- **[Hardware Guide](hardware/README.md)** - Wiring and ESP32 setup
- **[Backend API](backend/API_DOCUMENTATION.md)** - API reference and examples

## 🚀 Quick Start

### 1. Setup Database
- Create Supabase account (free)
- Run SQL migrations from `backend/migrations/`

### 2. Setup Backend
```bash
cd backend
npm install
# Configure .env with Supabase credentials
npm start
```

### 3. Setup Frontend
```bash
npx http-server frontend -p 5173
```

### 4. Upload ESP32 Code
- Configure WiFi in `hardware/esp32-attendance.ino`
- Upload to ESP32

### 5. Access Dashboard
- Open http://localhost:5173
- Login: `admin` / `admin123`

## ✨ Features

### Core Features
- ✅ **One-Tap IN/OUT** - Smart logic determines time in or time out
- ✅ **Real-time Dashboard** - Instant updates via WebSockets
- ✅ **DTR Reports** - Program-based hours tracking (CpE: 320hrs, IT: 500hrs)
- ✅ **RFID Card Management** - Easy card enrollment
- ✅ **Multi-Device Support** - Multiple RFID readers
- ✅ **Photo ID Cards** - Employee photo verification
- ✅ **Audit Logs** - Complete activity tracking

### Security
- Device API key authentication
- Admin JWT authentication
- Rate limiting
- 10-second tap cooldown

### Technology Stack
- **Hardware**: ESP32 + RC522 RFID Reader
- **Backend**: Node.js + Express + Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML5 + CSS3 + Vanilla JS

## 📁 Project Structure

```
attendance-system/
├── hardware/          # ESP32 code and wiring guide
├── backend/           # Node.js server and API
├── frontend/          # Web dashboard
└── DOCUMENTATION.md   # Complete documentation
```

## 🔧 System Requirements

- ESP32 board + RC522 RFID reader (~$15)
- Node.js v16+
- Supabase account (free)
- Arduino IDE

## 📖 Documentation

For complete setup instructions, API documentation, and troubleshooting, see:

**[📘 DOCUMENTATION.md](DOCUMENTATION.md)**

## 🆘 Support

- Check [DOCUMENTATION.md](DOCUMENTATION.md) for detailed guides
- Review troubleshooting section
- Verify database and API connections

---

**Version**: 2.0.0 | **Status**: Production Ready ✅ | **Last Updated**: February 5, 2026

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
