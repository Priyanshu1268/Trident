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

// --- MPU6050/6500 Registers ---
#define MPU_ADDR        0x68
#define REG_PWR_MGMT_1  0x6B
#define REG_GYRO_CONFIG 0x1B
#define REG_ACCEL_CONFIG 0x1C
#define REG_CONFIG      0x1A
#define REG_ACCEL_XOUT_H 0x3B

// Sensitivity scale factors matching the ranges configured below:
// Accel range set to +/-8G  -> 4096 LSB/g
// Gyro range set to +/-500 deg/s -> 65.5 LSB/(deg/s)
#define ACCEL_SENSITIVITY 4096.0
#define GYRO_SENSITIVITY  65.5

// --- Thresholds for Accident & Hazard Classification ---
#define CRASH_G_THRESHOLD    3.50   // G-force impact trigger (Gs)
#define ROLLOVER_THRESHOLD   50.0   // Tilt angle trigger (Degrees)
#define JERK_THRESHOLD       8.00   // Sudden shock slope (G/s)
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

// Function Prototypes
void sendATCommand(String cmd, unsigned long timeout = 1000);
void initSIM800L();
void sendEmergencySMS(String reason, float gVal, float rollVal);
void makeEmergencyCall(const char* phoneNumber);
void beepBuzzer(int times, int delayMs);
bool initMPU();
void readMPU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz, float &tempC);

void setup() {
  // 1. Initialize USB Serial for Web Dashboard
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[INIT] Starting SafeRide AI Master Firmware...");

  // 2. Configure I/O Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(SOS_SWITCH_PIN, INPUT_PULLDOWN); // ESP32 internal pull-down
  digitalWrite(BUZZER_PIN, LOW);

  // 3. Initialize MPU6050/6500 (I2C, raw register access)
  Wire.begin(SDA_PIN, SCL_PIN);
  mpuReady = initMPU();
  if (!mpuReady) {
    Serial.println("[ERROR] MPU sensor not detected. Check I2C wiring (SDA=21, SCL=22)!");
    beepBuzzer(3, 100);
  } else {
    Serial.println("[OK] MPU 6-Axis Sensor Ready (raw I2C).");
  }

  // 4. Initialize SIM800L GSM (UART2)
  sim800.begin(9600, SERIAL_8N1, SIM_RX2_PIN, SIM_TX2_PIN);
  delay(1000);
  initSIM800L();

  // Startup Success Tone
  beepBuzzer(2, 80);
  Serial.println("[READY] SafeRide AI System Active & Telemetry Streaming.\n");
}

void loop() {
  unsigned long now = millis();

  // --- Step A: Read MPU Sensor (raw I2C) ---
  float ax, ay, az, gxDps, gyDps, gzDps, tempC;
  readMPU(ax, ay, az, gxDps, gyDps, gzDps, tempC);
  // ax, ay, az are already in g's (raw register conversion below)

  float gForce = sqrt(ax * ax + ay * ay + az * az);

  // Angular Orientation (Pitch & Roll in Degrees)
  float pitch = atan2(ay, sqrt(ax * ax + az * az)) * 180.0 / PI;
  float roll  = atan2(-ax, az) * 180.0 / PI;

  // Rate of Change (Jerk in G/s)
  float dt = (now - lastSampleTime) / 1000.0;
  if (dt <= 0) dt = 0.02;
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
    } else if (cmd == "TEST_SOS") {
      isSosPressed = true;
    }
  }

  // --- Step C: State Machine & Accident Detection ---
  switch (currentState) {
    case STATE_NORMAL: {
      bool isHighImpact = (gForce >= CRASH_G_THRESHOLD && jerk >= JERK_THRESHOLD);
      bool isRollover   = (abs(roll) >= ROLLOVER_THRESHOLD || abs(pitch) >= ROLLOVER_THRESHOLD);

      if (isHighImpact || isRollover || isSosPressed) {
        currentState = STATE_COUNTDOWN;
        countdownStartTime = now;
        String reason = isSosPressed ? "MANUAL_SOS_TRIGGER" : (isHighImpact ? "HIGH_G_COLLISION" : "VEHICLE_ROLLOVER");
        Serial.printf("{\"alert\":\"CRASH_DETECTED\",\"reason\":\"%s\",\"gForce\":%.2f,\"roll\":%.1f}\n",
                      reason.c_str(), gForce, roll);
      }
      break;
    }

    case STATE_COUNTDOWN: {
      unsigned long elapsedSec = (now - countdownStartTime) / 1000;
      int remainingSec = COUNTDOWN_SECONDS - elapsedSec;

      // Pulsing Warning Alarm on Buzzer during countdown
      if ((now / 250) % 2 == 0) {
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

    StaticJsonDocument<256> doc;
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

  delay(20); // 50Hz internal loop cycle
}

// ============================================================================
// MPU6050/6500 Raw I2C Helper Functions
// ============================================================================

bool initMPU() {
  // Wake up the sensor (it starts in sleep mode)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_PWR_MGMT_1);
  Wire.write(0);
  byte error = Wire.endTransmission(true);
  if (error != 0) return false;

  // Set gyro range to +/-500 deg/s (FS_SEL=1 -> bits 4:3 = 01 -> 0x08)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_GYRO_CONFIG);
  Wire.write(0x08);
  Wire.endTransmission(true);

  // Set accel range to +/-8G (AFS_SEL=2 -> bits 4:3 = 10 -> 0x10)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_ACCEL_CONFIG);
  Wire.write(0x10);
  Wire.endTransmission(true);

  // Set digital low-pass filter to ~21Hz (DLPF_CFG=4)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_CONFIG);
  Wire.write(0x04);
  Wire.endTransmission(true);

  return true;
}

void readMPU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz, float &tempC) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

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
// SIM800L GSM Helper Functions
// ============================================================================

void sendATCommand(String cmd, unsigned long timeout) {
  sim800.println(cmd);
  unsigned long start = millis();
  while (millis() - start < timeout) {
    while (sim800.available()) {
      char c = sim800.read();
      // Optional: Serial.write(c);
    }
  }
}

void initSIM800L() {
  Serial.println("[GSM] Initializing SIM800L modem...");
  sendATCommand("AT", 1000);
  sendATCommand("ATE0", 1000);      // Echo off
  sendATCommand("AT+CMGF=1", 1000);  // Text mode for SMS
  sendATCommand("AT+CSCS=\"GSM\"", 1000);
  sendATCommand("AT+CSQ", 1000);     // Check Signal Quality
  Serial.println("[GSM] SIM800L Modem Initialized.");
}

void sendEmergencySMS(String reason, float gVal, float rollVal) {
  Serial.println("[GSM] Sending Cellular Emergency SMS Broadcast...");

  String message = "EMERGENCY ALERT: SafeRide AI Crash Detected!\n";
  message += "Vehicle: " + String(VEHICLE_REG_NO) + "\n";
  message += "Driver: " + String(DRIVER_NAME) + " (Blood: " + String(BLOOD_GROUP) + ")\n";
  message += "Impact: " + String(gVal, 1) + "G | Tilt: " + String(rollVal, 1) + " deg\n";
  message += "Event: " + reason + "\n";
  message += "Location: https://maps.google.com/?q=28.6139,77.2090\n";
  message += "Auto-dispatched by SafeRide AI.";

  // Send to Emergency Contact 1
  sim800.println("AT+CMGS=\"" + String(EMERGENCY_NUMBER_1) + "\"");
  delay(500);
  sim800.print(message);
  delay(500);
  sim800.write(26); // Ctrl+Z to send
  delay(3000);

  Serial.println("[GSM] SMS Broadcast Sent.");
}

void makeEmergencyCall(const char* phoneNumber) {
  Serial.printf("[GSM] Dialing Emergency Number: %s ...\n", phoneNumber);
  sim800.printf("ATD%s;\r\n", phoneNumber);
  delay(10000); // Ring for 10 seconds
  sim800.println("ATH"); // Hang up
}

void beepBuzzer(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(delayMs);
    digitalWrite(BUZZER_PIN, LOW);
    delay(delayMs);
  }
}
