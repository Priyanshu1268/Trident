#include <Arduino.h>
#include "../include/config.h"
#include "utils/logger.h"
#include "sensors/mpu6050.h"
#include "gsm/sim800l.h"
#include "network/wifi_manager.h"
#include "detection/accident_detector.h"
#include "communication/mqtt_client.h"

// Instantiate Global Peripherals
MPU6050Sensor imu(PIN_I2C_SDA, PIN_I2C_SCL, 0x68);
SIM800LModule gsm(Serial2, PIN_SIM800_RX, PIN_SIM800_TX, PIN_SIM800_RST);
WiFiManager wifi(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASS, SERVER_HOST, SERVER_PORT);
SafeRideMQTT mqtt(MQTT_BROKER, MQTT_PORT, MQTT_CLIENT_ID);
AccidentDetector detector(THRESHOLD_ACCEL_IMPACT_G, THRESHOLD_ROLLOVER_DEG, THRESHOLD_JERK_G_PER_SEC, CONFIRMATION_TIMEOUT_MS);

// Timing intervals
unsigned long lastSensorSampleTime = 0;
unsigned long lastTelemetrySendTime = 0;
unsigned long lastHeartbeatTime = 0;

// Current Sensor Cache
IMUData currentIMU;

void handleSerialCommands() {
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        if (cmd.equalsIgnoreCase("TEST_MPU")) {
            SystemLogger::info("TEST", "Running MPU6050 Diagnostic Check...");
            imu.readData(currentIMU);
            Serial.printf("Ax: %.2fg | Ay: %.2fg | Az: %.2fg | TotalAcc: %.2fg | Pitch: %.1f | Roll: %.1f\n",
                          currentIMU.ax, currentIMU.ay, currentIMU.az, currentIMU.totalAcc, currentIMU.pitch, currentIMU.roll);
        } else if (cmd.equalsIgnoreCase("TEST_GSM")) {
            SystemLogger::info("TEST", "Running GSM SIM800L Diagnostic Check...");
            int csq = gsm.checkSignalStrength();
            bool reg = gsm.checkRegistration();
            Serial.printf("CSQ Signal: %d/31 | Reg: %s | Ready: %s\n", csq, reg ? "OK" : "NO", gsm.isReady() ? "YES" : "NO");
        } else if (cmd.equalsIgnoreCase("TEST_SMS")) {
            SystemLogger::info("TEST", "Dispatching Test SMS via SIM800L...");
            gsm.sendEmergencyMessage(DEFAULT_EMERGENCY_PHONE, "Test Driver", 28.6139, 77.2090, "Blood Group: O+");
        } else if (cmd.equalsIgnoreCase("TEST_CALL")) {
            SystemLogger::info("TEST", "Initiating voice test call...");
            gsm.makeCall(DEFAULT_EMERGENCY_PHONE);
            delay(4000);
            gsm.hangUp();
        } else if (cmd.equalsIgnoreCase("TEST_ACCIDENT")) {
            SystemLogger::warn("TEST", "Simulating severe 4.85g vehicle collision event!");
            detector.forceTrigger("SIMULATED_COLLISION_TEST");
        } else if (cmd.equalsIgnoreCase("CANCEL") || cmd.equalsIgnoreCase("OK")) {
            detector.userCancelConfirmation();
        } else {
            Serial.println("[CMD] Unknown command. Available: TEST_MPU, TEST_GSM, TEST_SMS, TEST_CALL, TEST_ACCIDENT, CANCEL");
        }
    }
}

void setup() {
    SystemLogger::init(MONITOR_SPEED);
    SystemLogger::info("BOOT", "=== SafeRide AI Intelligent Accident Response System v%s ===", FIRMWARE_VERSION);

    // 1. Initialize MPU6050
    if (!imu.begin()) {
        SystemLogger::error("BOOT", "MPU6050 init failed. Retrying in background...");
    }

    // 2. Initialize SIM800L GSM Modem
    gsm.begin(9600);

    // 3. Initialize WiFi (Non-blocking fallback)
    wifi.begin();

    // 4. Initialize MQTT
    mqtt.begin();

    SystemLogger::info("BOOT", "System initialization complete. Monitoring motion at 50Hz.");
}

void loop() {
    unsigned long now = millis();

    // 1. High-frequency sensor read & accident processing (50 Hz / 20ms)
    if (now - lastSensorSampleTime >= SENSOR_SAMPLE_INTERVAL_MS) {
        lastSensorSampleTime = now;
        if (imu.readData(currentIMU)) {
            detector.processSample(currentIMU);
        }
    }

    // 2. Update state machine
    detector.updateStateMachine();

    // 3. Handle state transitions for emergency communication
    SystemState state = detector.getState();
    if (state == STATE_POSSIBLE_IMPACT) {
        // Send immediate alert payload to backend & MQTT
        String alertPayload = String("{") +
            "\"deviceId\":\"" + DEVICE_ID + "\"," +
            "\"vehicleNumber\":\"" + VEHICLE_NUMBER + "\"," +
            "\"gForce\":" + String(currentIMU.totalAcc, 2) + "," +
            "\"pitch\":" + String(currentIMU.pitch, 1) + "," +
            "\"roll\":" + String(currentIMU.roll, 1) + "," +
            "\"confidence\":" + String(detector.getLastResult().confidenceScore, 2) + "," +
            "\"reason\":\"" + detector.getLastResult().reason + "\"" +
            "}";

        if (wifi.isOnline()) {
            wifi.sendAlert(alertPayload);
            mqtt.publishAlert(alertPayload);
        }
    } else if (state == STATE_ACCIDENT_CONFIRMED) {
        // Fallback: If internet offline, SIM800L sends emergency SMS immediately!
        if (!wifi.isOnline() && gsm.isReady()) {
            SystemLogger::warn("FALLBACK", "WiFi offline! Dispatching emergency SMS via SIM800L GSM Modem...");
            gsm.sendEmergencyMessage(DEFAULT_EMERGENCY_PHONE, "Driver (KA-01-SR-2026)", 28.6139, 77.2090, "Blood: O+");
        }
    }

    // 4. Periodic Telemetry Stream (2 Hz / 500ms)
    if (now - lastTelemetrySendTime >= TELEMETRY_SEND_INTERVAL_MS) {
        lastTelemetrySendTime = now;

        String telemetryJson = String("{") +
            "\"deviceId\":\"" + DEVICE_ID + "\"," +
            "\"vehicleNumber\":\"" + VEHICLE_NUMBER + "\"," +
            "\"gForce\":" + String(currentIMU.totalAcc, 2) + "," +
            "\"accelX\":" + String(currentIMU.ax, 2) + "," +
            "\"accelY\":" + String(currentIMU.ay, 2) + "," +
            "\"accelZ\":" + String(currentIMU.az, 2) + "," +
            "\"gyroX\":" + String(currentIMU.gx, 1) + "," +
            "\"gyroY\":" + String(currentIMU.gy, 1) + "," +
            "\"gyroZ\":" + String(currentIMU.gz, 1) + "," +
            "\"pitch\":" + String(currentIMU.pitch, 1) + "," +
            "\"roll\":" + String(currentIMU.roll, 1) + "," +
            "\"jerk\":" + String(currentIMU.jerk, 2) + "," +
            "\"state\":\"" + detector.getStateString() + "\"," +
            "\"csq\":" + String(gsm.checkSignalStrength()) +
            "}";

        if (wifi.isOnline()) {
            wifi.sendTelemetry(telemetryJson);
            mqtt.publishTelemetry(telemetryJson);
        }
    }

    // 5. MQTT loop & command handling
    mqtt.loop();
    handleSerialCommands();
}
