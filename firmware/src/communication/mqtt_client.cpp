#include "mqtt_client.h"
#include "../utils/logger.h"

SafeRideMQTT::SafeRideMQTT(const char* host, int p, const char* id)
    : broker(host), port(p), clientId(id), client(espClient) {}

bool SafeRideMQTT::begin() {
    client.setServer(broker, port);
    SystemLogger::info("MQTT", "Configured MQTT broker at %s:%d", broker, port);
    return true;
}

void SafeRideMQTT::loop() {
    if (WiFi.status() == WL_CONNECTED && !client.connected()) {
        static unsigned long lastReconnectAttempt = 0;
        if (millis() - lastReconnectAttempt > 5000) {
            lastReconnectAttempt = millis();
            if (client.connect(clientId)) {
                SystemLogger::info("MQTT", "MQTT connected as %s", clientId);
            }
        }
    }
    client.loop();
}

bool SafeRideMQTT::publishTelemetry(const String &payload) {
    if (!client.connected()) return false;
    String topic = "saferide/device/" + String(clientId) + "/telemetry";
    return client.publish(topic.c_str(), payload.c_str());
}

bool SafeRideMQTT::publishAlert(const String &payload) {
    if (!client.connected()) return false;
    String topic = "saferide/device/" + String(clientId) + "/alert";
    return client.publish(topic.c_str(), payload.c_str());
}

bool SafeRideMQTT::isConnected() {
    return client.connected();
}
