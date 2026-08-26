#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ==========================================
// 1. HARDWARE PIN DEFINITIONS (CONFIGURABLE)
// ==========================================

// MPU6050 I2C Pins
#define PIN_I2C_SDA             21
#define PIN_I2C_SCL             22

// SIM800L Hardware UART2 Pins
#define PIN_SIM800_RX           16  // Connects to SIM800L TXD
#define PIN_SIM800_TX           17  // Connects to SIM800L RXD
#define PIN_SIM800_RST          4   // Optional SIM800L Reset Pin

// Optional Status Peripherals (Future Expansion)
#define PIN_BUZZER              25
#define PIN_LED_STATUS          2
#define PIN_SOS_BUTTON          34

// ==========================================
// 2. NETWORK & TELEMETRY CONFIGURATION
// ==========================================

// WiFi Credentials (Replace with your local hotspot)
#define DEFAULT_WIFI_SSID       "SafeRide_AP"
#define DEFAULT_WIFI_PASS       "safe_ride_2026"

// SafeRide Backend Host / Cloud IP
#define SERVER_HOST             "192.168.1.100"
#define SERVER_PORT             3000
#define TELEMETRY_ENDPOINT      "/api/v1/hardware/telemetry"
#define ALERT_ENDPOINT          "/api/v1/hardware/alert"

// MQTT Configuration
#define MQTT_BROKER             "192.168.1.100"
#define MQTT_PORT               1883
#define MQTT_CLIENT_ID          "ESP32_SAFERIDE_001"
#define MQTT_TOPIC_TELEMETRY    "saferide/device/ESP32_001/telemetry"
#define MQTT_TOPIC_ALERT        "saferide/device/ESP32_001/alert"
#define MQTT_TOPIC_STATUS       "saferide/device/ESP32_001/status"

// Device Identity
#define DEVICE_ID               "ESP32_SAFERIDE_001"
#define VEHICLE_NUMBER          "KA-01-SR-2026"
#define FIRMWARE_VERSION        "2.1.0-SafeRide"

// ==========================================
// 3. DETECTION THRESHOLDS & TUNING
// ==========================================

// Level 1 Rule-Based Thresholds
#define THRESHOLD_ACCEL_IMPACT_G    3.5f    // G-force spike threshold
#define THRESHOLD_JERK_G_PER_SEC    8.0f    // Sudden rate of acceleration change
#define THRESHOLD_ROLLOVER_DEG      55.0f   // Severe tilt angle (degrees)
#define THRESHOLD_HIGH_GYRO_DPS     250.0f  // Severe angular velocity (deg/sec)
#define CONFIRMATION_TIMEOUT_MS     30000   // 30 Seconds user response window

// Sampling Rates
#define SENSOR_SAMPLE_INTERVAL_MS   20      // 50 Hz sensor sampling
#define TELEMETRY_SEND_INTERVAL_MS  500     // 2 Hz standard HTTP/MQTT telemetry
#define HEARTBEAT_INTERVAL_MS       5000    // 5 seconds device heartbeat

// Emergency Escalation Contacts (Configurable via Serial / API)
#define DEFAULT_EMERGENCY_PHONE     "+919876543210"
#define DEFAULT_SECONDARY_PHONE     "+919876543211"

// Safety Mode Flag
#define DEMO_MODE                   1       // 1 = Safe simulated dispatches, 0 = Production

#endif // CONFIG_H
