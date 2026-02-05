/*
 * ESP32 RFID Attendance System
 * 
 * Hardware: ESP32 + RC522 RFID Reader
 * 
 * Wiring:
 * RC522 → ESP32
 * SDA   → GPIO 5
 * SCK   → GPIO 18
 * MOSI  → GPIO 23
 * MISO  → GPIO 19
 * RST   → GPIO 22
 * 3.3V  → 3.3V (NOT 5V!)
 * GND   → GND
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ========================================
// CONFIGURATION - UPDATE THESE VALUES
// ========================================

// Wi-Fi Credentials
const char* WIFI_SSID = "BatStateU ICT";
const char* WIFI_PASSWORD = "Leading Innovations, Transforming Lives";

// Server Configuration
const char* SERVER_URL = "http://192.168.102.34:3000/api/tap";  // Change to your server IP
const char* SERVER_HEALTH = "http://192.168.102.34:3000/api/health"; // Health check endpoint

// Device API Key (from admin dashboard)
const char* DEVICE_API_KEY = "51a2aa1cbe70f01bc38c36b929c02d7ef20fde92696c5e35e57763ce4b27a120";

// Device Info (will be registered automatically)
const char* DEVICE_ID = "main-entrance";  // Unique identifier for this scanner

// ========================================
// PIN DEFINITIONS
// ========================================
#define SS_PIN 5
#define RST_PIN 22

// ========================================
// GLOBAL VARIABLES
// ========================================
MFRC522 rfid(SS_PIN, RST_PIN);
unsigned long lastTapTime = 0;
const unsigned long DEBOUNCE_DELAY = 10000; // 10 seconds between taps

// LED & Buzzer Feedback (optional)
#define LED_PIN 2
#define BUZZER_PIN 4  // Optional buzzer on GPIO 4
#define LED_SUCCESS_PIN 2   // Green LED (or built-in)
#define LED_ERROR_PIN 15    // Red LED (optional)

// ========================================
// SETUP
// ========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("╔════════════════════════════════════╗");
  Serial.println("║  RFID Attendance System - ESP32    ║");
  Serial.println("║  Backend: Supabase + Express       ║");
  Serial.println("╚════════════════════════════════════╝");
  
  // Initialize LED & Buzzer
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Initialize SPI and RFID
  SPI.begin();
  rfid.PCD_Init();
  
  Serial.println("[✓] RFID Reader initialized");
  Serial.print("[i] RFID Reader Version: ");
  rfid.PCD_DumpVersionToSerial();
  
  // Connect to Wi-Fi
  connectWiFi();
  
  // Test server connection
  testServerConnection();
  
  Serial.println("\n[✓] System ready! Waiting for RFID cards...\n");
  blinkLED(3, 200); // Blink 3 times to indicate ready
}

// ========================================
// MAIN LOOP
// ========================================
void loop() {
  // Check Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[!] Wi-Fi disconnected. Reconnecting...");
    connectWiFi();
  }
  
  // Look for new cards
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }
  
  // Select one of the cards
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }
  
  // Check debounce (prevent double-taps)
  unsigned long currentTime = millis();
  if (currentTime - lastTapTime < DEBOUNCE_DELAY) {
    Serial.println("[!] Too soon! Please wait...");
    blinkLED(2, 100);
    rfid.PICC_HaltA();
    return;
  }
  
  // Get UID
  String uid = getCardUID();
  Serial.println("╔════════════════════════════════════╗");
  Serial.println("║        CARD DETECTED!              ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.print("[i] Card UID: ");
  Serial.println(uid);
  
  // Send to server
  sendToServer(uid);
  
  // Update last tap time
  lastTapTime = currentTime;
  
  // Halt PICC
  rfid.PICC_HaltA();
  
  // Stop encryption on PCD
  rfid.PCD_StopCrypto1();
}

// ========================================
// FUNCTIONS
// ========================================

void connectWiFi() {
  Serial.print("[i] Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[✓] Wi-Fi Connected!");
    Serial.print("[i] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[✗] Wi-Fi Connection Failed!");
    Serial.println("[!] Please check credentials and try again");
  }
}

String getCardUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void sendToServer(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[✗] No Wi-Fi connection!");
    playErrorSound();
    return;
  }
  
  HTTPClient http;
  
  Serial.println("[→] Sending to server...");
  Serial.print("[i] UID: ");
  Serial.println(uid);
  
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", DEVICE_API_KEY);
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["uid"] = uid;
  doc["timestamp"] = millis();
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.print("[i] Payload: ");
  Serial.println(jsonPayload);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("[✓] HTTP Response Code: ");
    Serial.println(httpResponseCode);
    
    String response = http.getString();
    Serial.print("[i] Response: ");
    Serial.println(response);
    
    // Parse and display response
    parseResponse(response);
    
  } else {
    Serial.print("[✗] HTTP Error Code: ");
    Serial.println(httpResponseCode);
    
    if (httpResponseCode == -1) {
      Serial.println("[!] Connection failed - check if server is running");
    } else if (httpResponseCode == -11) {
      Serial.println("[!] Timeout - server not responding");
    }
    
    Serial.println("[!] Troubleshooting:");
    Serial.println("    1. Check SERVER_URL IP address");
    Serial.println("    2. Ensure backend server is running");
    Serial.println("    3. Verify ESP32 and server on same network");
    Serial.println("    4. Check DEVICE_API_KEY is correct");
    
    playErrorSound();
  }
  
  http.end();
  Serial.println("────────────────────────────────────\n");
}

void parseResponse(String response) {
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.println("[!] JSON parsing failed");
    return;
  }
  
  // Check for error response
  if (doc.containsKey("error")) {
    String errorMsg = doc["error"].as<String>();
    Serial.println("╔════════════════════════════════════╗");
    Serial.println("║          ❌ ERROR                   ║");
    Serial.println("╚════════════════════════════════════╝");
    Serial.print("[!] ");
    Serial.println(errorMsg);
    
    if (errorMsg.indexOf("not registered") >= 0 || errorMsg.indexOf("Card not") >= 0) {
      Serial.println("\n[i] This card is not registered!");
      Serial.println("[→] To register:");
      Serial.println("    1. Login to admin dashboard");
      Serial.println("    2. Add employee first");
      Serial.println("    3. Go to Enrollment tab");
      Serial.println("    4. Select employee and enter this UID");
      
      if (doc.containsKey("uid")) {
        Serial.print("\n[i] Card UID to register: ");
        Serial.println(doc["uid"].as<String>());
      }
    }
    
    // Error feedback
    playErrorSound();
    return;
  }
  
  // Success response
  if (doc.containsKey("status")) {
    String status = doc["status"].as<String>();
    String name = doc["name"] | "Unknown";
    String action = doc["action"] | "Unknown";
    String employeeCode = doc["employee_code"] | "";
    String time = doc["time"] | "";
    
    Serial.println("╔════════════════════════════════════╗");
    Serial.println("║          ✅ SUCCESS                 ║");
    Serial.println("╚════════════════════════════════════╝");
    Serial.print("[✓] Employee: ");
    Serial.println(name);
    Serial.print("[✓] Code: ");
    Serial.println(employeeCode);
    Serial.print("[✓] Action: ");
    Serial.println(action);
    
    if (action == "TIME_IN") {
      Serial.println("[i] 🌅 Timed IN successfully!");
      playSuccessSound();
    } else if (action == "TIME_OUT") {
      Serial.println("[i] 🌆 Timed OUT successfully!");
      playSuccessSound();
    }
  }
}

void testServerConnection() {
  Serial.println("[i] Testing server connection...");
  
  HTTPClient http;
  http.begin(SERVER_HEALTH);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("[✓] Server is reachable!");
    Serial.print("[i] Response: ");
    Serial.println(response);
  } else if (httpCode > 0) {
    Serial.print("[!] Server responded with code: ");
    Serial.println(httpCode);
  } else {
    Serial.println("[✗] Cannot reach server!");
    Serial.println("[!] Please check:");
    Serial.println("    1. Server is running (npm start)");
    Serial.println("    2. SERVER_URL is correct");
    Serial.println("    3. ESP32 and server on same network");
  }
  
  http.end();
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

void playSuccessSound() {
  // Two short beeps for success
  tone(BUZZER_PIN, 2000, 100);
  delay(150);
  tone(BUZZER_PIN, 2500, 100);
  delay(150);
  
  // Blink LED green
  for (int i = 0; i < 2; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}

void playErrorSound() {
  // Long beep for error
  tone(BUZZER_PIN, 500, 300);
  delay(400);
  
  // Blink LED red (fast)
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
    delay(50);
  }
}
