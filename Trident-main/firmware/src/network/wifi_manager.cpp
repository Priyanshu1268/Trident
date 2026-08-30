#include "wifi_manager.h"
#include "../utils/logger.h"

WiFiManager::WiFiManager(const char* s, const char* p, const char* host, int port)
    : ssid(s), password(p), isConnected(false) {
    serverUrl = "http://" + String(host) + ":" + String(port);
}

bool WiFiManager::begin() {
    if (ssid.length() == 0) {
        SystemLogger::warn("WIFI", "No WiFi SSID provided. Operating in GSM/Offline mode.");
        return false;
    }

    SystemLogger::info("WIFI", "Connecting to WiFi SSID: %s...", ssid.c_str());
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), password.c_str());

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - start < 8000)) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        isConnected = true;
        SystemLogger::info("WIFI", "WiFi Connected! IP: %s", WiFi.localIP().toString().c_str());
        return true;
    }

    SystemLogger::warn("WIFI", "WiFi connection timeout. Fallback to GSM SIM800L active.");
    isConnected = false;
    return false;
}

bool WiFiManager::checkConnection() {
    isConnected = (WiFi.status() == WL_CONNECTED);
    return isConnected;
}

bool WiFiManager::sendTelemetry(const String &jsonPayload) {
    if (!checkConnection()) return false;

    HTTPClient http;
    String endpoint = serverUrl + "/api/v1/hardware/telemetry";
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonPayload);
    http.end();
    return (httpCode == 200 || httpCode == 201);
}

bool WiFiManager::sendAlert(const String &jsonPayload) {
    if (!checkConnection()) return false;

    HTTPClient http;
    String endpoint = serverUrl + "/api/v1/hardware/alert";
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(jsonPayload);
    http.end();
    return (httpCode == 200 || httpCode == 201);
}
