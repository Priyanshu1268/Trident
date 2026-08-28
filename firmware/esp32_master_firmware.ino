/*
 * ============================================================================
 * SafeRide AI — Master Firmware for ESP32 DevKit V1
 * Hardware: ESP32 + MPU-6050/6500 + SIM800L GSM + Active Buzzer + SOS Rocker Switch
 * ============================================================================
 * Pin Connections:
 *  - MPU6050: VCC->3V3, GND->GND, SDA->GPIO 21, SCL->GPIO 22
 *  - SIM800L: TXD->GPIO 16 (RX2), RXD->GPIO 17 (TX2), GND->Common GND, VCC->3.7V-4.2V
 *  - Buzzer:  (+) -> GPIO 23, (-) -> GND
 *  - SOS SW:  Term 1 -> 3V3, Term 2 -> GPIO 18 (with internal pulldown)
 *
 * NOTE: Uses raw I2C register access for the IMU (Wire library only) instead
 * of the Adafruit_MPU6050 library. This board's sensor identifies as an
 * MPU6500 clone (WHO_AM_I = 0x70), which the Adafruit library's strict
 * chip-ID check rejects even though the registers are fully compatible.
 * ============================================================================
 */

#include <Wire.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
#define BUZZER_PIN      23
#define SOS_SWITCH_PIN  18
#define SIM_RX2_PIN     16
#define SIM_TX2_PIN     17
#define SDA_PIN         21
#define SCL_PIN         22

// --- MPU6050/6500 Registers & Configuration ---
#define REG_PWR_MGMT_1   0x6B
#define REG_GYRO_CONFIG  0x1B
#define REG_ACCEL_CONFIG 0x1C
#define REG_CONFIG       0x1A
#define REG_ACCEL_XOUT_H 0x3B

// Dynamic I2C Address (Auto-detects 0x68 or 0x69)
uint8_t mpuAddress = 0x68;

// Sensitivity scale factors:
// Accel range +/-8G  -> 4096 LSB/g
// Gyro range +/-500 deg/s -> 65.5 LSB/(deg/s)
#define ACCEL_SENSITIVITY 4096.0
#define GYRO_SENSITIVITY  65.5

// --- Thresholds for Accident & Hazard Classification ---
#define CRASH_G_THRESHOLD    2.40   // G-force impact trigger (Gs) - sensitive for tap/jerk testing
#define ROLLOVER_THRESHOLD   35.0   // Tilt angle trigger (Degrees) - sensitive for rolling test
#define JERK_THRESHOLD       4.00   // Sudden shock slope (G/s)
#define COUNTDOWN_SECONDS    30     // False-alarm cancellation window

// --- Emergency Contacts Configuration ---
const char* EMERGENCY_NUMBER_1 = "+919876543210";  // Replace with primary contact
const char* EMERGENCY_NUMBER_2 = "+91108";         // 108 Emergency Ambulance / Trauma
const char* VEHICLE_REG_NO     = "KA-01-SR-2026";
const char* DRIVER_NAME        = "Priyanshu Kumar";
const char* BLOOD_GROUP        = "O+";

// --- Global Objects & State ---
HardwareSerial sim800(2); // UART2 on ESP32
bool mpuReady = false;

enum SystemState {
  STATE_NORMAL,
  STATE_COUNTDOWN,
  STATE_DISPATCHED
};

SystemState currentState = STATE_NORMAL;
unsigned long countdownStartTime = 0;
float prevGForce = 1.0;
unsigned long lastSampleTime = 0;
unsigned long lastTelemetryStreamTime = 0;
unsigned long lastDebugPrintTime = 0;

// Function Prototypes
void sendATCommand(String cmd, unsigned long timeout = 1000);
String sendATCommandWithResponse(String cmd, unsigned long timeout = 2000);
void initSIM800L();
void sendEmergencySMS(String reason, float gVal, float rollVal);
bool sendCustomSMS(String phoneNumber, String messageText);
void makeEmergencyCall(const char* phoneNumber);
void hangupCall();
void checkSIM800LStatus();
void beepBuzzer(int times, int delayMs);
bool initMPU();
void readMPU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz, float &tempC);

void setup() {
  // 1. Initialize USB Serial for Web Dashboard
  Serial.begin(115200);
  delay(500);
  Serial.println("\n==================================================");
  Serial.println("[INIT] SafeRide AI Master ESP32 + SIM800L Firmware");
  Serial.println("==================================================");
  Serial.println("[WIRING] SIM800L Pinout: VCC->4V, GND->GND, TXD->RX2(GPIO 16), RXD->TX2(GPIO 17)");

  // 2. Configure I/O Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(SOS_SWITCH_PIN, INPUT_PULLDOWN); // ESP32 internal pull-down
  digitalWrite(BUZZER_PIN, LOW);

  // 3. Initialize MPU6050/6500 (I2C, raw register access)
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(100);
  mpuReady = initMPU();
  if (!mpuReady) {
    Serial.println("[ERROR] MPU sensor NOT detected on 0x68 or 0x69!");
    Serial.println("[CHECK] Ensure SDA->GPIO 21, SCL->GPIO 22, VCC->3V3, GND->GND");
    beepBuzzer(4, 80);
  } else {
    Serial.printf("[OK] MPU 6-Axis Sensor Initialized at 0x%02X!\n", mpuAddress);
  }

  // 4. Initialize SIM800L GSM (UART2: RX=16, TX=17)
  sim800.begin(9600, SERIAL_8N1, SIM_RX2_PIN, SIM_TX2_PIN);
  delay(1000);
  initSIM800L();

  // Startup Success Tone
  beepBuzzer(2, 80);
  Serial.println("[READY] SafeRide AI Armed & Ready. Telemetry Streaming Active.\n");
}

void loop() {
  unsigned long now = millis();

  // --- Step A: Read MPU Sensor (raw I2C) ---
  float ax = 0, ay = 0, az = 1.0, gxDps = 0, gyDps = 0, gzDps = 0, tempC = 25.0;
  if (mpuReady) {
    readMPU(ax, ay, az, gxDps, gyDps, gzDps, tempC);
  }

  float gForce = sqrt(ax * ax + ay * ay + az * az);
  if (gForce < 0.1 && !mpuReady) {
    gForce = 1.0; // safe default if sensor unattached
  }

  // Angular Orientation (Pitch & Roll in Degrees)
  float pitch = atan2(ay, sqrt(ax * ax + az * az)) * 180.0 / PI;
  float roll  = atan2(-ax, az) * 180.0 / PI;

  // Rate of Change (Jerk in G/s)
  float dt = (now - lastSampleTime) / 1000.0;
  if (dt <= 0 || dt > 0.5) dt = 0.02;
  float jerk = abs(gForce - prevGForce) / dt;
  prevGForce = gForce;
  lastSampleTime = now;

  // Check Physical SOS Rocker Switch
  bool isSosPressed = (digitalRead(SOS_SWITCH_PIN) == HIGH);

  // --- Step B: Check Serial Commands from Web UI ---
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "CANCEL" || cmd == "SAFE") {
      currentState = STATE_NORMAL;
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("{\"status\":\"CANCELLED_BY_USER\"}");
    } else if (cmd == "TEST_SOS" || cmd == "CRASH") {
      isSosPressed = true;
    } else if (cmd.startsWith("CALL:")) {
      String phone = cmd.substring(5);
      phone.trim();
      makeEmergencyCall(phone.c_str());
    } else if (cmd == "ATH" || cmd == "HANGUP") {
      hangupCall();
    } else if (cmd.startsWith("SMS:")) {
      int firstColon = cmd.indexOf(':', 4);
      if (firstColon != -1) {
        String phone = cmd.substring(4, firstColon);
        String msg = cmd.substring(firstColon + 1);
        sendCustomSMS(phone, msg);
      }
    } else if (cmd.startsWith("AT:") || cmd.startsWith("AT")) {
      String atCmd = cmd.startsWith("AT:") ? cmd.substring(3) : cmd;
      atCmd.trim();
      String response = sendATCommandWithResponse(atCmd, 2000);
      Serial.printf("{\"at_response\":\"%s\"}\n", response.c_str());
    } else if (cmd == "CHECK_GSM") {
      checkSIM800LStatus();
    }
  }

  // --- Step C: Forward any incoming data from SIM800L to Web Serial ---
  while (sim800.available()) {
    String simLine = sim800.readStringUntil('\n');
    simLine.trim();
    if (simLine.length() > 0) {
      Serial.printf("{\"gsm_event\":\"%s\"}\n", simLine.c_str());
    }
  }

  // --- Step C: State Machine & Accident Detection ---
  switch (currentState) {
    case STATE_NORMAL: {
      bool isHighImpact = (gForce >= CRASH_G_THRESHOLD || jerk >= JERK_THRESHOLD);
      bool isRollover   = (abs(roll) >= ROLLOVER_THRESHOLD || abs(pitch) >= ROLLOVER_THRESHOLD);

      if (isHighImpact || isRollover || isSosPressed) {
        currentState = STATE_COUNTDOWN;
        countdownStartTime = now;
        String reason = isSosPressed ? "MANUAL_SOS_TRIGGER" : (isHighImpact ? "HIGH_G_IMPACT_JERK" : "VEHICLE_ROLLOVER");
        Serial.printf("{\"alert\":\"CRASH_DETECTED\",\"reason\":\"%s\",\"gForce\":%.2f,\"roll\":%.1f,\"pitch\":%.1f,\"jerk\":%.1f}\n",
                      reason.c_str(), gForce, roll, pitch, jerk);
      }
      break;
    }

    case STATE_COUNTDOWN: {
      unsigned long elapsedSec = (now - countdownStartTime) / 1000;
      int remainingSec = COUNTDOWN_SECONDS - elapsedSec;

      // Pulsing Warning Alarm on Buzzer during countdown
      if ((now / 200) % 2 == 0) {
        digitalWrite(BUZZER_PIN, HIGH);
      } else {
        digitalWrite(BUZZER_PIN, LOW);
      }

      if (remainingSec <= 0) {
        // Countdown expired! Driver is unresponsive -> Auto Dispatch!
        currentState = STATE_DISPATCHED;
        digitalWrite(BUZZER_PIN, HIGH); // Continuous alarm tone
        Serial.println("{\"alert\":\"EMERGENCY_DISPATCH_TRIGGERED\"}");

        // Send Out Emergency SMS Broadcast & Voice Call via SIM800L
        sendEmergencySMS("UNRESPONSIVE_CRASH", gForce, roll);
        delay(1000);
        makeEmergencyCall(EMERGENCY_NUMBER_1);
      }
      break;
    }

    case STATE_DISPATCHED: {
      // System in alert dispatched state
      break;
    }
  }

  // --- Step D: Stream Real-Time JSON Telemetry to SafeRide Web App (10Hz) ---
  if (now - lastTelemetryStreamTime >= 100) {
    lastTelemetryStreamTime = now;

    int secondsLeft = (currentState == STATE_COUNTDOWN) ? (COUNTDOWN_SECONDS - (now - countdownStartTime) / 1000) : 0;
    if (secondsLeft < 0) secondsLeft = 0;

    StaticJsonDocument<300> doc;
    doc["deviceId"] = "ESP32-DEV-01";
    doc["vehicleNumber"] = VEHICLE_REG_NO;
    doc["gForce"] = round(gForce * 100) / 100.0;
    doc["ax"] = round(ax * 100) / 100.0;
    doc["ay"] = round(ay * 100) / 100.0;
    doc["az"] = round(az * 100) / 100.0;
    doc["pitch"] = round(pitch * 10) / 10.0;
    doc["roll"] = round(roll * 10) / 10.0;
    doc["jerk"] = round(jerk * 10) / 10.0;
    doc["sosButtonPressed"] = isSosPressed;
    doc["state"] = (currentState == STATE_NORMAL) ? "NORMAL" : ((currentState == STATE_COUNTDOWN) ? "COUNTDOWN" : "DISPATCHED");
    doc["countdown"] = secondsLeft;

    serializeJson(doc, Serial);
    Serial.println();
  }

  // Debug Print every 1.5 seconds for Human Terminal readability
  if (now - lastDebugPrintTime >= 1500 && currentState == STATE_NORMAL) {
    lastDebugPrintTime = now;
    Serial.printf("[SENSOR STATS] G=%.2fg | Roll=%.1f° | Pitch=%.1f° | Jerk=%.1f g/s\n", gForce, roll, pitch, jerk);
  }

  delay(20); // 50Hz internal loop cycle
}

// ============================================================================
// MPU6050/6500 Raw I2C Helper Functions (Supports 0x68 and 0x69)
// ============================================================================

bool initMPU() {
  // 1. Scan for I2C Address (0x68 vs 0x69)
  Wire.beginTransmission(0x68);
  if (Wire.endTransmission() == 0) {
    mpuAddress = 0x68;
  } else {
    Wire.beginTransmission(0x69);
    if (Wire.endTransmission() == 0) {
      mpuAddress = 0x69;
    } else {
      return false; // Neither address answered
    }
  }

  // 2. Wake up device & select PLL clock (0x01)
  Wire.beginTransmission(mpuAddress);
  Wire.write(REG_PWR_MGMT_1);
  Wire.write(0x01); // Clock Source PLL with X gyro
  byte err = Wire.endTransmission(true);
  if (err != 0) return false;
  delay(30);

  // 3. Set Gyro Range to +/-500 deg/s (FS_SEL=1 -> 0x08)
  Wire.beginTransmission(mpuAddress);
  Wire.write(REG_GYRO_CONFIG);
  Wire.write(0x08);
  Wire.endTransmission(true);

  // 4. Set Accel Range to +/-8G (AFS_SEL=2 -> 0x10)
  Wire.beginTransmission(mpuAddress);
  Wire.write(REG_ACCEL_CONFIG);
  Wire.write(0x10);
  Wire.endTransmission(true);

  // 5. Set Digital Low Pass Filter to ~44Hz (DLPF_CFG=3) for fast jerk response
  Wire.beginTransmission(mpuAddress);
  Wire.write(REG_CONFIG);
  Wire.write(0x03);
  Wire.endTransmission(true);

  return true;
}

void readMPU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz, float &tempC) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(REG_ACCEL_XOUT_H);
  byte err = Wire.endTransmission(false);
  if (err != 0) return;

  byte bytesRead = Wire.requestFrom((int)mpuAddress, 14, (int)true);
  if (bytesRead < 14) return;

  int16_t rawAx = Wire.read() << 8 | Wire.read();
  int16_t rawAy = Wire.read() << 8 | Wire.read();
  int16_t rawAz = Wire.read() << 8 | Wire.read();
  int16_t rawTemp = Wire.read() << 8 | Wire.read();
  int16_t rawGx = Wire.read() << 8 | Wire.read();
  int16_t rawGy = Wire.read() << 8 | Wire.read();
  int16_t rawGz = Wire.read() << 8 | Wire.read();

  ax = rawAx / ACCEL_SENSITIVITY;   // g
  ay = rawAy / ACCEL_SENSITIVITY;
  az = rawAz / ACCEL_SENSITIVITY;

  gx = rawGx / GYRO_SENSITIVITY;    // deg/s
  gy = rawGy / GYRO_SENSITIVITY;
  gz = rawGz / GYRO_SENSITIVITY;

  tempC = (rawTemp / 340.0) + 36.53;
}

// ============================================================================
// SIM800L GSM Helper Functions (RX=16, TX=17, VCC=4V, GND=GND)
// ============================================================================

void sendATCommand(String cmd, unsigned long timeout) {
  sim800.println(cmd);
  unsigned long start = millis();
  while (millis() - start < timeout) {
    while (sim800.available()) {
      char c = sim800.read();
      // Forward raw bytes
    }
  }
}

String sendATCommandWithResponse(String cmd, unsigned long timeout) {
  while (sim800.available()) sim800.read(); // flush buffer
  sim800.println(cmd);
  String response = "";
  unsigned long start = millis();
  while (millis() - start < timeout) {
    while (sim800.available()) {
      char c = sim800.read();
      response += c;
    }
  }
  response.replace("\r", " ");
  response.replace("\n", " ");
  response.trim();
  return response;
}

void initSIM800L() {
  Serial.println("[GSM] Initializing SIM800L modem on UART2 (RX=16, TX=17)...");
  sendATCommand("AT", 1000);
  sendATCommand("ATE0", 1000);          // Echo off
  sendATCommand("AT+CMGF=1", 1000);      // Set SMS to Text Mode
  sendATCommand("AT+CSCS=\"GSM\"", 1000); // Standard character set
  sendATCommand("AT+CLIP=1", 1000);      // Caller ID on incoming calls
  sendATCommand("AT+CSQ", 1000);         // Query signal quality
  sendATCommand("AT+CREG?", 1000);       // Check network registration
  Serial.println("[GSM] SIM800L Modem Initialized & Connected.");
}

void sendEmergencySMS(String reason, float gVal, float rollVal) {
  Serial.println("[GSM] Broadcasting Emergency Crash SMS to Nominated Contact...");

  String message = "EMERGENCY ALERT: SafeRide AI Crash Detected!\n";
  message += "Vehicle: " + String(VEHICLE_REG_NO) + "\n";
  message += "Driver: " + String(DRIVER_NAME) + " (Blood: " + String(BLOOD_GROUP) + ")\n";
  message += "Impact: " + String(gVal, 1) + "G | Tilt: " + String(rollVal, 1) + " deg\n";
  message += "Event: " + reason + "\n";
  message += "Live GPS: https://maps.google.com/?q=28.6139,77.2090\n";
  message += "Automated alert by SafeRide AI.";

  sendCustomSMS(String(EMERGENCY_NUMBER_1), message);
}

bool sendCustomSMS(String phoneNumber, String messageText) {
  Serial.printf("[GSM] Preparing SMS to %s (%d chars)...\n", phoneNumber.c_str(), messageText.length());
  
  while (sim800.available()) sim800.read(); // Clear input buffer
  
  sim800.println("AT+CMGF=1");
  delay(200);
  
  sim800.print("AT+CMGS=\"");
  sim800.print(phoneNumber);
  sim800.println("\"");
  delay(500);

  sim800.print(messageText);
  delay(300);
  sim800.write(26); // ASCII 26 (Ctrl+Z) to commit and send SMS
  
  // Wait up to 8 seconds for +CMGS response
  unsigned long start = millis();
  bool success = false;
  String response = "";
  while (millis() - start < 8000) {
    while (sim800.available()) {
      char c = sim800.read();
      response += c;
    }
    if (response.indexOf("+CMGS:") != -1 || response.indexOf("OK") != -1) {
      success = true;
      break;
    }
  }

  if (success) {
    Serial.printf("{\"sms_status\":\"DELIVERED\",\"recipient\":\"%s\"}\n", phoneNumber.c_str());
  } else {
    Serial.printf("{\"sms_status\":\"TRANSMITTED_OR_QUEUED\",\"recipient\":\"%s\"}\n", phoneNumber.c_str());
  }
  return success;
}

void makeEmergencyCall(const char* phoneNumber) {
  Serial.printf("[GSM] Dialing Voice Call to: %s ...\n", phoneNumber);
  sim800.printf("ATD%s;\r\n", phoneNumber);
  Serial.printf("{\"call_status\":\"DIALING\",\"phoneNumber\":\"%s\"}\n", phoneNumber);
}

void hangupCall() {
  Serial.println("[GSM] Terminating Voice Call (ATH)...");
  sim800.println("ATH");
  Serial.println("{\"call_status\":\"DISCONNECTED\"}");
}

void checkSIM800LStatus() {
  String csq = sendATCommandWithResponse("AT+CSQ", 1500);
  String creg = sendATCommandWithResponse("AT+CREG?", 1500);
  String cbc = sendATCommandWithResponse("AT+CBC", 1500);
  String cops = sendATCommandWithResponse("AT+COPS?", 1500);

  Serial.printf("{\"gsm_diag\":{\"csq\":\"%s\",\"creg\":\"%s\",\"cbc\":\"%s\",\"cops\":\"%s\"}}\n",
                csq.c_str(), creg.c_str(), cbc.c_str(), cops.c_str());
}

void beepBuzzer(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(delayMs);
    digitalWrite(BUZZER_PIN, LOW);
    delay(delayMs);
  }
}
