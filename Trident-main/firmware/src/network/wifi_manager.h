#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

class WiFiManager {
private:
    String ssid;
    String password;
    String serverUrl;
    bool isConnected;

public:
    WiFiManager(const char* ssid = "", const char* pass = "", const char* host = "192.168.1.100", int port = 3000);
    bool begin();
    bool checkConnection();
    bool sendTelemetry(const String &jsonPayload);
    bool sendAlert(const String &jsonPayload);
    bool isOnline() const { return isConnected; }
};

#endif // WIFI_MANAGER_H
