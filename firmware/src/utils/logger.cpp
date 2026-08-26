#include "logger.h"
#include <stdarg.h>

void SystemLogger::init(unsigned long baudRate) {
    Serial.begin(baudRate);
    delay(100);
    Serial.println("\n[SYSTEM] SafeRide AI Core Logger Initialized.");
}

void SystemLogger::log(LogLevel level, const char* tag, const char* format, ...) {
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);

    const char* levelStr = "INFO";
    switch (level) {
        case LOG_LEVEL_DEBUG:    levelStr = "DEBUG"; break;
        case LOG_LEVEL_INFO:     levelStr = "INFO"; break;
        case LOG_LEVEL_WARN:     levelStr = "WARN"; break;
        case LOG_LEVEL_ERROR:    levelStr = "ERROR"; break;
        case LOG_LEVEL_CRITICAL: levelStr = "CRITICAL"; break;
    }

    unsigned long ms = millis();
    Serial.printf("[%lu ms] [%s] [%s] %s\n", ms, levelStr, tag, buffer);
}

void SystemLogger::debug(const char* tag, const char* format, ...) {
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    log(LOG_LEVEL_DEBUG, tag, "%s", buffer);
}

void SystemLogger::info(const char* tag, const char* format, ...) {
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    log(LOG_LEVEL_INFO, tag, "%s", buffer);
}

void SystemLogger::warn(const char* tag, const char* format, ...) {
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    log(LOG_LEVEL_WARN, tag, "%s", buffer);
}

void SystemLogger::error(const char* tag, const char* format, ...) {
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    log(LOG_LEVEL_ERROR, tag, "%s", buffer);
}

void SystemLogger::critical(const char* tag, const char* format, ...) {
    char buffer[256];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    log(LOG_LEVEL_CRITICAL, tag, "%s", buffer);
}
