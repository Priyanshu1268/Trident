#ifndef LOGGER_H
#define LOGGER_H

#include <Arduino.h>

enum LogLevel {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO  = 1,
    LOG_LEVEL_WARN  = 2,
    LOG_LEVEL_ERROR = 3,
    LOG_LEVEL_CRITICAL = 4
};

class SystemLogger {
public:
    static void init(unsigned long baudRate = 115200);
    static void log(LogLevel level, const char* tag, const char* format, ...);
    static void debug(const char* tag, const char* format, ...);
    static void info(const char* tag, const char* format, ...);
    static void warn(const char* tag, const char* format, ...);
    static void error(const char* tag, const char* format, ...);
    static void critical(const char* tag, const char* format, ...);
};

#endif // LOGGER_H
