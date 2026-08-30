#ifndef SENSOR_MPU6050_H
#define SENSOR_MPU6050_H

#include <Arduino.h>
#include <Wire.h>

struct IMUData {
    float ax; // g
    float ay; // g
    float az; // g
    float gx; // deg/s
    float gy; // deg/s
    float gz; // deg/s
    float totalAcc; // sqrt(ax^2 + ay^2 + az^2)
    float totalGyro; // sqrt(gx^2 + gy^2 + gz^2)
    float pitch; // degrees
    float roll; // degrees
    float jerk; // g/s
    unsigned long timestamp;
};

class MPU6050Sensor {
private:
    uint8_t sdaPin;
    uint8_t sclPin;
    uint8_t i2cAddress;
    bool isReady;
    float prevTotalAcc;
    unsigned long prevTime;

public:
    MPU6050Sensor(uint8_t sda = 21, uint8_t scl = 22, uint8_t address = 0x68);
    bool begin();
    bool readData(IMUData &data);
    bool isConnected() const { return isReady; }
    void calibrate();
};

#endif // SENSOR_MPU6050_H
