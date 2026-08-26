#ifndef ACCIDENT_DETECTOR_H
#define ACCIDENT_DETECTOR_H

#include <Arduino.h>
#include "../sensors/mpu6050.h"

enum SystemState {
    STATE_NORMAL,
    STATE_POSSIBLE_IMPACT,
    STATE_CONFIRMATION_PENDING,
    STATE_ACCIDENT_CONFIRMED,
    STATE_EMERGENCY_SENT,
    STATE_RECOVERY
};

struct DetectionResult {
    bool isTriggered;
    float impactMagnitude; // g
    float maxGyro;         // deg/s
    float jerk;            // g/s
    float pitch;           // degrees
    float roll;            // degrees
    float confidenceScore; // 0.0 to 1.0
    const char* reason;
};

class AccidentDetector {
private:
    SystemState currentState;
    unsigned long stateEnterTime;
    unsigned long confirmationDurationMs;
    float impactThresholdG;
    float rolloverThresholdDeg;
    float jerkThreshold;

    // Feature extraction rolling window buffer (last 20 samples = 1 sec at 20ms)
    static const int WINDOW_SIZE = 25;
    float accHistory[WINDOW_SIZE];
    float gyroHistory[WINDOW_SIZE];
    int historyIndex;
    int historyCount;

    DetectionResult lastResult;

public:
    AccidentDetector(float impactG = 3.5f, float rolloverDeg = 55.0f, float jerkThresh = 8.0f, unsigned long timeoutMs = 30000);

    void processSample(const IMUData &data);
    void updateStateMachine();
    void userCancelConfirmation();
    void forceTrigger(const char* reason = "MANUAL_TEST");
    void resetToNormal();

    SystemState getState() const { return currentState; }
    const char* getStateString() const;
    unsigned long getRemainingCountdownMs() const;
    const DetectionResult& getLastResult() const { return lastResult; }
};

#endif // ACCIDENT_DETECTOR_H
