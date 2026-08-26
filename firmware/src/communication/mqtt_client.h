#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>
#include <WiFiClient.h>
#include <PubSubClient.h>

class SafeRideMQTT {
private:
    WiFiClient espClient;
    PubSubClient client;
    const char* broker;
    int port;
    const char* clientId;

public:
    SafeRideMQTT(const char* host = "192.168.1.100", int p = 1883, const char* id = "ESP32_SAFERIDE_001");
    bool begin();
    void loop();
    bool publishTelemetry(const String &payload);
    bool publishAlert(const String &payload);
    bool isConnected();
};

#endif // MQTT_CLIENT_H
