#ifndef GSM_SIM800L_H
#define GSM_SIM800L_H

#include <Arduino.h>

class SIM800LModule {
private:
    HardwareSerial &serialPort;
    uint8_t rxPin;
    uint8_t txPin;
    uint8_t rstPin;
    bool isModuleReady;
    int signalQuality; // CSQ 0-31

    String sendATCommand(const String &cmd, unsigned long timeoutMs = 2000, const char* expected = "OK");

public:
    SIM800LModule(HardwareSerial &serial, uint8_t rx = 16, uint8_t tx = 17, uint8_t rst = 4);
    bool begin(unsigned long baudRate = 9600);
    bool checkSIM();
    bool checkRegistration();
    int checkSignalStrength();
    bool sendSMS(const String &phoneNumber, const String &message);
    bool makeCall(const String &phoneNumber);
    bool hangUp();
    bool sendEmergencyMessage(const String &contact, const String &userName, float lat, float lon, const String &medicalInfo);
    bool isReady() const { return isModuleReady; }
};

#endif // GSM_SIM800L_H
