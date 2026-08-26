#include "accident_detector.h"
#include "../utils/logger.h"
#include <math.h>

AccidentDetector::AccidentDetector(float impactG, float rolloverDeg, float jerkThresh, unsigned long timeoutMs)
    : currentState(STATE_NORMAL), stateEnterTime(0), confirmationDurationMs(timeoutMs),
      impactThresholdG(impactG), rolloverThresholdDeg(rolloverDeg), jerkThreshold(jerkThresh),
      historyIndex(0), historyCount(0) {
    lastResult = {false, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, "NONE"};
    for (int i = 0; i < WINDOW_SIZE; i++) {
        accHistory[i] = 1.0f;
        gyroHistory[i] = 0.0f;
    }
}

void AccidentDetector::processSample(const IMUData &data) {
    // Add to rolling window buffer
    accHistory[historyIndex] = data.totalAcc;
    gyroHistory[historyIndex] = data.totalGyro;
    historyIndex = (historyIndex + 1) % WINDOW_SIZE;
    if (historyCount < WINDOW_SIZE) historyCount++;

    // Calculate rolling stats
    float maxAcc = 0.0f, sumAcc = 0.0f;
    float maxGyr = 0.0f;
    for (int i = 0; i < historyCount; i++) {
        if (accHistory[i] > maxAcc) maxAcc = accHistory[i];
        if (gyroHistory[i] > maxGyr) maxGyr = gyroHistory[i];
        sumAcc += accHistory[i];
    }
    float meanAcc = (historyCount > 0) ? (sumAcc / historyCount) : 1.0f;

    // Multi-Layer Rules
    bool isImpact = (data.totalAcc >= impactThresholdG) || (maxAcc >= impactThresholdG);
    bool isRollover = (fabs(data.pitch) >= rolloverThresholdDeg) || (fabs(data.roll) >= rolloverThresholdDeg);
    bool isViolentJerk = (data.jerk >= jerkThreshold);

    if (currentState == STATE_NORMAL) {
        if (isImpact || isRollover || isViolentJerk) {
            float confidence = 0.0f;
            const char* reasonStr = "UNKNOWN";

            if (isImpact && isRollover) {
                confidence = 0.96f;
                reasonStr = "SEVERE_IMPACT_AND_ROLLOVER";
            } else if (isImpact) {
                confidence = fmin(0.92f, 0.65f + (data.totalAcc / 10.0f) * 0.25f);
                reasonStr = "HIGH_G_FORCE_COLLISION";
            } else if (isRollover) {
                confidence = 0.88f;
                reasonStr = "VEHICLE_ROLLOVER";
            } else if (isViolentJerk) {
                confidence = 0.72f;
                reasonStr = "SUDDEN_DECELERATION_JERK";
            }

            lastResult.isTriggered = true;
            lastResult.impactMagnitude = data.totalAcc;
            lastResult.maxGyro = maxGyr;
            lastResult.jerk = data.jerk;
            lastResult.pitch = data.pitch;
            lastResult.roll = data.roll;
            lastResult.confidenceScore = confidence;
            lastResult.reason = reasonStr;

            currentState = STATE_POSSIBLE_IMPACT;
            stateEnterTime = millis();
            SystemLogger::warn("DETECTION", "Possible accident detected! Reason: %s (G: %.2f, Tilt: %.1f, Conf: %.2f)",
                               reasonStr, data.totalAcc, fmax(fabs(data.pitch), fabs(data.roll)), confidence);
        }
    }
}

void AccidentDetector::updateStateMachine() {
    unsigned long now = millis();

    switch (currentState) {
        case STATE_NORMAL:
            // Continuous monitoring
            break;

        case STATE_POSSIBLE_IMPACT:
            // Transition immediately to confirmation pending window
            currentState = STATE_CONFIRMATION_PENDING;
            stateEnterTime = now;
            SystemLogger::warn("STATE", "Entering CONFIRMATION_PENDING state. Countdown: %lu ms", confirmationDurationMs);
            break;

        case STATE_CONFIRMATION_PENDING:
            if (now - stateEnterTime >= confirmationDurationMs) {
                // Timeout elapsed without user cancellation -> ACCIDENT CONFIRMED
                currentState = STATE_ACCIDENT_CONFIRMED;
                stateEnterTime = now;
                SystemLogger::critical("STATE", "Confirmation timer expired! ACCIDENT CONFIRMED. Triggering escalation!");
            }
            break;

        case STATE_ACCIDENT_CONFIRMED:
            // Next cycle transitions to EMERGENCY_SENT
            currentState = STATE_EMERGENCY_SENT;
            stateEnterTime = now;
            SystemLogger::info("STATE", "Entering EMERGENCY_SENT state.");
            break;

        case STATE_EMERGENCY_SENT:
            // Allow recovery after 15 seconds
            if (now - stateEnterTime > 15000) {
                currentState = STATE_RECOVERY;
                stateEnterTime = now;
                SystemLogger::info("STATE", "Entering RECOVERY state.");
            }
            break;

        case STATE_RECOVERY:
            if (now - stateEnterTime > 5000) {
                resetToNormal();
            }
            break;
    }
}

void AccidentDetector::userCancelConfirmation() {
    if (currentState == STATE_CONFIRMATION_PENDING || currentState == STATE_POSSIBLE_IMPACT) {
        SystemLogger::info("DETECTION", "User pressed 'I'M OK'. False alarm cancelled by driver.");
        resetToNormal();
    }
}

void AccidentDetector::forceTrigger(const char* reason) {
    lastResult.isTriggered = true;
    lastResult.impactMagnitude = 4.85f;
    lastResult.maxGyro = 310.0f;
    lastResult.jerk = 14.2f;
    lastResult.pitch = 18.0f;
    lastResult.roll = 62.0f;
    lastResult.confidenceScore = 0.94f;
    lastResult.reason = reason;

    currentState = STATE_POSSIBLE_IMPACT;
    stateEnterTime = millis();
    SystemLogger::warn("DETECTION", "Manual/Simulated accident triggered: %s", reason);
}

void AccidentDetector::resetToNormal() {
    currentState = STATE_NORMAL;
    lastResult.isTriggered = false;
    lastResult.reason = "NORMAL";
    SystemLogger::info("STATE", "System status: NORMAL / SAFE");
}

const char* AccidentDetector::getStateString() const {
    switch (currentState) {
        case STATE_NORMAL: return "NORMAL";
        case STATE_POSSIBLE_IMPACT: return "POSSIBLE_IMPACT";
        case STATE_CONFIRMATION_PENDING: return "CONFIRMATION_PENDING";
        case STATE_ACCIDENT_CONFIRMED: return "ACCIDENT_CONFIRMED";
        case STATE_EMERGENCY_SENT: return "EMERGENCY_SENT";
        case STATE_RECOVERY: return "RECOVERY";
        default: return "UNKNOWN";
    }
}

unsigned long AccidentDetector::getRemainingCountdownMs() const {
    if (currentState != STATE_CONFIRMATION_PENDING) return 0;
    unsigned long elapsed = millis() - stateEnterTime;
    if (elapsed >= confirmationDurationMs) return 0;
    return confirmationDurationMs - elapsed;
}
