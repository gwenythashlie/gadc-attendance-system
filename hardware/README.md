# ESP32 RFID Hardware Setup Guide

## 📦 Hardware Requirements

- **ESP32 Development Board** (any variant)
- **RC522 RFID Reader Module** (13.56 MHz)
- **RFID Cards/Keychains** (MIFARE Classic 1K or compatible)
- **Buzzer** (Optional - for audio feedback)
- **LEDs** (Optional - for visual feedback)
- **Jumper Wires**
- **USB Cable** (for programming)

---

## 🔌 Wiring Diagram

### RC522 → ESP32 Connections

| RC522 Pin | ESP32 Pin | Description |
|-----------|-----------|-------------|
| SDA/SS    | GPIO 5    | Chip Select |
| SCK       | GPIO 18   | SPI Clock |
| MOSI      | GPIO 23   | Master Out Slave In |
| MISO      | GPIO 19   | Master In Slave Out |
| RST       | GPIO 22   | Reset |
| 3.3V      | 3.3V      | **⚠️ USE 3.3V NOT 5V!** |
| GND       | GND       | Ground |

### Optional Components

| Component | ESP32 Pin | Description |
|-----------|-----------|-------------|
| Buzzer +  | GPIO 4    | Audio feedback |
| Buzzer -  | GND       | Ground |
| LED (Green) | GPIO 2  | Success indicator (built-in LED) |
| LED (Red) | GPIO 15   | Error indicator (optional) |

**⚠️ IMPORTANT:** The RC522 module operates at **3.3V**. Do NOT connect it to 5V or you may damage it!

---

## 🔧 Software Setup

### 1. Install Arduino IDE

1. Download Arduino IDE from https://www.arduino.cc/en/software
2. Install and open Arduino IDE

### 2. Install ESP32 Board Support

1. Go to **File → Preferences**
2. In "Additional Board Manager URLs", add:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Go to **Tools → Board → Boards Manager**
4. Search for "esp32" and install "**ESP32 by Espressif Systems**"
5. Select your board: **Tools → Board → ESP32 Arduino → ESP32 Dev Module**

### 3. Install Required Libraries

Go to **Sketch → Include Library → Manage Libraries** and install:

- **MFRC522** by GithubCommunity (for RFID reader)
- **ArduinoJson** by Benoit Blanchon (version 6.x)

---

## ⚙️ Configuration

### 1. Get Your Device API Key

Before uploading the code, you need to create a device in the admin dashboard:

1. Open browser and go to: `http://localhost:3000` (or your server IP)
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Click **"Devices"** tab
4. Click **"Add Device"**
5. Enter device details:
   - **Device Name:** "Main Entrance Scanner" (or any name)
   - **Location:** "Front Door" (optional)
6. Click **Create**
7. **COPY THE API KEY** - you'll need it for the ESP32 code!

Example API Key: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### 2. Update ESP32 Code

Open `esp32-attendance.ino` and update these lines:

```cpp
// Wi-Fi Credentials
const char* WIFI_SSID = "YourWiFiName";          // ← Change this
const char* WIFI_PASSWORD = "YourWiFiPassword";  // ← Change this

// Server Configuration
const char* SERVER_URL = "http://192.168.1.100:3000/api/tap";      // ← Change IP
const char* SERVER_HEALTH = "http://192.168.1.100:3000/api/health"; // ← Change IP

// Device API Key (from step 1 above)
const char* DEVICE_API_KEY = "paste-your-api-key-here";  // ← Paste API key here
```

**How to find your server IP:**
- Windows: Open Command Prompt and run `ipconfig` (look for IPv4 Address)
- Mac/Linux: Open Terminal and run `ifconfig` or `ip addr`

---

## 📤 Upload to ESP32

### 1. Connect ESP32 to Computer

- Plug ESP32 into computer via USB cable
- Select the correct COM port: **Tools → Port → COMx** (Windows) or **/dev/ttyUSBx** (Linux/Mac)

### 2. Configure Upload Settings

- **Board:** ESP32 Dev Module
- **Upload Speed:** 115200
- **Flash Frequency:** 80MHz
- **Port:** Select your ESP32's port

### 3. Upload the Code

1. Click **Verify** (✓) button to compile
2. Fix any errors if they appear
3. Click **Upload** (→) button
4. Wait for "Hard resetting via RTS pin..." message
5. Upload complete!

---

## 🧪 Testing

### 1. Open Serial Monitor

1. Click **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see:

```
╔════════════════════════════════════╗
║  RFID Attendance System - ESP32    ║
║  Backend: Supabase + Express       ║
╚════════════════════════════════════╝
[✓] RFID Reader initialized
[i] RFID Reader Version: ...
[i] Connecting to Wi-Fi: YourWiFiName
[✓] Wi-Fi Connected!
[i] IP Address: 192.168.1.XXX
[i] Testing server connection...
[✓] Server is reachable!

[✓] System ready! Waiting for RFID cards...
```

### 2. Test RFID Card Reading

1. **Tap an unregistered card** on the RFID reader
2. You should see:

```
╔════════════════════════════════════╗
║        CARD DETECTED!              ║
╚════════════════════════════════════╝
[i] Card UID: 04A1B2C3D4E5F6
[→] Sending to server...
╔════════════════════════════════════╗
║          ❌ ERROR                   ║
╚════════════════════════════════════╝
[!] Card not registered

[i] This card is not registered!
[→] To register:
    1. Login to admin dashboard
    2. Add employee first
    3. Go to Enrollment tab
    4. Select employee and enter this UID

[i] Card UID to register: 04A1B2C3D4E5F6
```

3. **Copy the UID** and register it in the admin dashboard (see below)

### 3. Register the Card

1. Go to admin dashboard: `http://192.168.1.100:3000`
2. Click **"Employees"** tab
3. Click **"+ Add Employee"** if you haven't already
4. Go to **"Enrollment"** tab
5. Select the employee
6. **Paste the UID** from Serial Monitor: `04A1B2C3D4E5F6`
7. Click **"🏷️ Assign Card"**
8. Success!

### 4. Test Registered Card

1. **Tap the registered card** again
2. You should see:

```
╔════════════════════════════════════╗
║        CARD DETECTED!              ║
╚════════════════════════════════════╝
[i] Card UID: 04A1B2C3D4E5F6
[→] Sending to server...
╔════════════════════════════════════╗
║          ✅ SUCCESS                 ║
╚════════════════════════════════════╝
[✓] Employee: Juan Dela Cruz
[✓] Code: INT-001
[✓] Action: TIME_IN
[i] 🌅 Timed IN successfully!
```

3. **Tap again** to TIME OUT:

```
[✓] Action: TIME_OUT
[i] 🌆 Timed OUT successfully!
```

4. Check the **Dashboard** tab on the web interface - you should see the attendance event in real-time!

---

## 🔊 Feedback Indicators

### LED Feedback

- **2 quick blinks:** Success (TIME_IN or TIME_OUT)
- **5 fast blinks:** Error (card not registered, network error, etc.)
- **3 slow blinks:** System ready on startup

### Buzzer Feedback (if connected)

- **Two short beeps (high pitch):** Success
- **One long beep (low pitch):** Error

---

## 🐛 Troubleshooting

### Problem: "Wi-Fi Connection Failed"

**Solutions:**
- Check WIFI_SSID and WIFI_PASSWORD are correct
- Make sure ESP32 is within Wi-Fi range
- Check if network uses 2.4GHz (ESP32 doesn't support 5GHz)
- Try restarting your router

### Problem: "Cannot reach server"

**Solutions:**
- Check if backend server is running (`npm start` in backend folder)
- Verify SERVER_URL IP address is correct
- Make sure ESP32 and server are on the same network
- Try accessing `http://YOUR_IP:3000/api/health` from your computer browser
- Check firewall settings on server computer

### Problem: "Invalid API key" or "401 Unauthorized"

**Solutions:**
- Make sure you created a device in the admin dashboard
- Copy the DEVICE_API_KEY exactly (including all characters)
- Check for extra spaces in the code
- Verify the API key in Supabase database (devices table)

### Problem: "Card not registered" every time

**Solutions:**
- Make sure you added an employee first
- Check that you enrolled the card with the correct UID
- UID is case-insensitive but must match exactly
- Verify in the admin dashboard Employees tab (should show "✓ Card Assigned")

### Problem: RFID reader not detecting cards

**Solutions:**
- Check all wiring connections
- Ensure RC522 is connected to 3.3V (NOT 5V!)
- Try reseating all jumper wires
- Test with different RFID cards (some cards may not be compatible)
- Check Serial Monitor for "RFID Reader initialized" message

### Problem: Cards detected but random errors

**Solutions:**
- Check DEBOUNCE_DELAY setting (default 10 seconds)
- Ensure stable power supply to ESP32
- Try different USB cable or power adapter
- Check for loose connections

---

## 📊 Serial Monitor Output Guide

### Successful TIME_IN:
```
[i] Card UID: 04A1B2C3D4E5F6
[→] Sending to server...
[✓] HTTP Response Code: 200
╔════════════════════════════════════╗
║          ✅ SUCCESS                 ║
╚════════════════════════════════════╝
[✓] Employee: Juan Dela Cruz
[✓] Code: INT-001
[✓] Action: TIME_IN
[i] 🌅 Timed IN successfully!
```

### Card Not Registered:
```
[i] Card UID: 04A1B2C3D4E5F6
[→] Sending to server...
[✓] HTTP Response Code: 404
╔════════════════════════════════════╗
║          ❌ ERROR                   ║
╚════════════════════════════════════╝
[!] Card not registered
[i] Card UID to register: 04A1B2C3D4E5F6
```

### Network Error:
```
[✗] HTTP Error Code: -1
[!] Connection failed - check if server is running
[!] Troubleshooting:
    1. Check SERVER_URL IP address
    2. Ensure backend server is running
    3. Verify ESP32 and server on same network
    4. Check DEVICE_API_KEY is correct
```

---

## 🔒 Security Notes

- The DEVICE_API_KEY should be kept secret
- Don't share your API key publicly
- Change default admin password after first login
- Consider using HTTPS in production (requires certificate)
- Keep ESP32 firmware updated

---

## 📚 Additional Resources

- **Backend API Documentation:** `backend/API_DOCUMENTATION.md`
- **Supabase Setup Guide:** `backend/SUPABASE_SETUP.md`
- **ESP32 Documentation:** https://docs.espressif.com/projects/arduino-esp32/
- **MFRC522 Library:** https://github.com/miguelbalboa/rfid

---

## ✅ Quick Checklist

Before deploying your system:

- [ ] ESP32 properly wired to RC522
- [ ] Wi-Fi credentials configured
- [ ] Backend server running
- [ ] Device created in admin dashboard
- [ ] DEVICE_API_KEY copied to ESP32 code
- [ ] Code uploaded to ESP32
- [ ] Serial Monitor shows "System ready!"
- [ ] Server health check passes
- [ ] Test card registered and working
- [ ] Real-time updates working on dashboard

---

**Your ESP32 RFID attendance system is now ready to use! 🎉**

For support, check the Serial Monitor output for detailed error messages.
