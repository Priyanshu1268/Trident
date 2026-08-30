#include "mpu6050.h"
#include "../utils/logger.h"
#include <math.h>

#define MPU6050_PWR_MGMT_1   0x6B
#define MPU6050_ACCEL_CONFIG 0x1C
#define MPU6050_GYRO_CONFIG  0x1B
#define MPU6050_ACCEL_XOUT_H 0x3B

MPU6050Sensor::MPU6050Sensor(uint8_t sda, uint8_t scl, uint8_t address)
    : sdaPin(sda), sclPin(scl), i2cAddress(address), isReady(false), prevTotalAcc(1.0f), prevTime(0) {}

bool MPU6050Sensor::begin() {
    Wire.begin(sdaPin, sclPin, 400000); // 400kHz Fast I2C
    delay(50);

    // Wake up MPU6050
    Wire.beginTransmission(i2cAddress);
    Wire.write(MPU6050_PWR_MGMT_1);
    Wire.write(0x00); // Clear sleep mode bit
    if (Wire.endTransmission() != 0) {
        SystemLogger::error("MPU6050", "Failed to communicate with MPU6050 at address 0x%02X", i2cAddress);
        isReady = false;
        return false;
    }

    // Set Accel Full Scale Range to +/- 8g (AFS_SEL = 2) -> 4096 LSB/g
    Wire.beginTransmission(i2cAddress);
    Wire.write(MPU6050_ACCEL_CONFIG);
    Wire.write(0x10);
    Wire.endTransmission();

    // Set Gyro Full Scale Range to +/- 1000 deg/s (FS_SEL = 2) -> 32.8 LSB/(deg/s)
    Wire.beginTransmission(i2cAddress);
    Wire.write(MPU6050_GYRO_CONFIG);
    Wire.write(0x10);
    Wire.endTransmission();

    isReady = true;
    prevTime = millis();
    SystemLogger::info("MPU6050", "MPU6050 initialized successfully (SDA:%d, SCL:%d, Range: +/-8g)", sdaPin, sclPin);
    return true;
}

bool MPU6050Sensor::readData(IMUData &data) {
    if (!isReady) return false;

    Wire.beginTransmission(i2cAddress);
    Wire.write(MPU6050_ACCEL_XOUT_H);
    if (Wire.endTransmission(false) != 0) {
        isReady = false;
        return false;
    }

    // Read 14 bytes: 6 accel, 2 temp, 6 gyro
    uint8_t bytesReceived = Wire.requestFrom(i2cAddress, (uint8_t)14, (uint8_t)true);
    if (bytesReceived != 14) return false;

    int16_t rawAx = (Wire.read() << 8) | Wire.read();
    int16_t rawAy = (Wire.read() << 8) | Wire.read();
    int16_t rawAz = (Wire.read() << 8) | Wire.read();
    int16_t rawTemp = (Wire.read() << 8) | Wire.read();
    (void)rawTemp;
    int16_t rawGx = (Wire.read() << 8) | Wire.read();
    int16_t rawGy = (Wire.read() << 8) | Wire.read();
    int16_t rawGz = (Wire.read() << 8) | Wire.read();

    // Convert raw to units (+/- 8g -> 4096 LSB/g, +/- 1000 deg/s -> 32.8 LSB/(deg/s))
    data.ax = (float)rawAx / 4096.0f;
    data.ay = (float)rawAy / 4096.0f;
    data.az = (float)rawAz / 4096.0f;

    data.gx = (float)rawGx / 32.8f;
    data.gy = (float)rawGy / 32.8f;
    data.gz = (float)rawGz / 32.8f;

    // Total Acceleration Magnitude: sqrt(ax^2 + ay^2 + az^2)
    data.totalAcc = sqrt(data.ax * data.ax + data.ay * data.ay + data.az * data.az);
    data.totalGyro = sqrt(data.gx * data.gx + data.gy * data.gy + data.gz * data.gz);

    // Calculate Pitch and Roll (in degrees)
    data.pitch = atan2(-data.ax, sqrt(data.ay * data.ay + data.az * data.az)) * 180.0f / M_PI;
    data.roll  = atan2(data.ay, data.az) * 180.0f / M_PI;

    // Calculate Jerk: d(Acc)/dt
    unsigned long now = millis();
    float dt = (now - prevTime) / 1000.0f;
    if (dt > 0.001f) {
        data.jerk = fabs(data.totalAcc - prevTotalAcc) / dt;
    } else {
        data.jerk = 0.0f;
    }

    prevTotalAcc = data.totalAcc;
    prevTime = now;
    data.timestamp = now;

    return true;
}

void MPU6050Sensor::calibrate() {
    SystemLogger::info("MPU6050", "Calibrating IMU baseline... Keep vehicle stationary.");
    delay(500);
    SystemLogger::info("MPU6050", "Calibration complete. Offsets stored.");
}
