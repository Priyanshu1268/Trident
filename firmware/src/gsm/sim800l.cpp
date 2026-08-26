#include "sim800l.h"
#include "../utils/logger.h"

SIM800LModule::SIM800LModule(HardwareSerial &serial, uint8_t rx, uint8_t tx, uint8_t rst)
    : serialPort(serial), rxPin(rx), txPin(tx), rstPin(rst), isModuleReady(false), signalQuality(0) {}

String SIM800LModule::sendATCommand(const String &cmd, unsigned long timeoutMs, const char* expected) {
    while (serialPort.available()) serialPort.read(); // Flush RX buffer
    serialPort.println(cmd);

    String response = "";
    unsigned long start = millis();
    while (millis() - start < timeoutMs) {
        while (serialPort.available()) {
            char c = serialPort.read();
            response += c;
        }
        if (response.indexOf(expected) != -1) {
            break;
        }
    }
    return response;
}

bool SIM800LModule::begin(unsigned long baudRate) {
    serialPort.begin(baudRate, SERIAL_8N1, rxPin, txPin);
    delay(500);

    SystemLogger::info("SIM800L", "Initializing GSM modem on RX:%d TX:%d at %lu baud...", rxPin, txPin, baudRate);

    // Test basic AT response
    String res = sendATCommand("AT", 1000, "OK");
    if (res.indexOf("OK") == -1) {
        // Try waking up modem with autobauding
        sendATCommand("AT", 1000, "OK");
        res = sendATCommand("AT", 1000, "OK");
    }

    if (res.indexOf("OK") == -1) {
        SystemLogger::warn("SIM800L", "SIM800L not responding to AT commands. (Check 4.0V 2A power supply)");
        isModuleReady = false;
        return false;
    }

    // Set text mode for SMS
    sendATCommand("ATE0", 1000, "OK"); // Echo OFF
    sendATCommand("AT+CMGF=1", 1000, "OK"); // SMS Text Mode
    sendATCommand("AT+CNMI=2,2,0,0,0", 1000, "OK"); // New message indicator

    isModuleReady = true;
    checkSIM();
    checkSignalStrength();
    checkRegistration();
    SystemLogger::info("SIM800L", "SIM800L GSM modem online. CSQ:%d", signalQuality);
    return true;
}

bool SIM800LModule::checkSIM() {
    String res = sendATCommand("AT+CPIN?", 2000, "READY");
    if (res.indexOf("READY") != -1) {
        SystemLogger::debug("SIM800L", "SIM Card Status: READY");
        return true;
    }
    SystemLogger::warn("SIM800L", "SIM Card Missing or PIN Locked");
    return false;
}

bool SIM800LModule::checkRegistration() {
    String res = sendATCommand("AT+CREG?", 2000, "+CREG:");
    if (res.indexOf(",1") != -1 || res.indexOf(",5") != -1) {
        SystemLogger::debug("SIM800L", "Network Registration: REGISTERED (Home/Roaming)");
        return true;
    }
    SystemLogger::warn("SIM800L", "Network Registration: SEARCHING...");
    return false;
}

int SIM800LModule::checkSignalStrength() {
    String res = sendATCommand("AT+CSQ", 1500, "+CSQ:");
    int idx = res.indexOf("+CSQ: ");
    if (idx != -1) {
        int commaIdx = res.indexOf(",", idx);
        if (commaIdx != -1) {
            String csqStr = res.substring(idx + 6, commaIdx);
            signalQuality = csqStr.toInt();
            return signalQuality;
        }
    }
    return 0;
}

bool SIM800LModule::sendSMS(const String &phoneNumber, const String &message) {
    if (phoneNumber.length() == 0 || message.length() == 0) return false;

    SystemLogger::info("SIM800L", "Dispatching SMS to %s (%d chars)...", phoneNumber.c_str(), message.length());
    sendATCommand("AT+CMGF=1", 1000, "OK");

    serialPort.print("AT+CMGS=\"");
    serialPort.print(phoneNumber);
    serialPort.println("\"");
    delay(200);

    serialPort.print(message);
    delay(100);
    serialPort.write(26); // Ctrl+Z character to transmit SMS

    unsigned long start = millis();
    String response = "";
    while (millis() - start < 10000) {
        while (serialPort.available()) {
            response += (char)serialPort.read();
        }
        if (response.indexOf("+CMGS:") != -1 || response.indexOf("OK") != -1) {
            SystemLogger::info("SIM800L", "SMS successfully delivered to GSM network!");
            return true;
        }
    }

    SystemLogger::error("SIM800L", "SMS dispatch timeout/failure.");
    return false;
}

bool SIM800LModule::makeCall(const String &phoneNumber) {
    if (phoneNumber.length() == 0) return false;
    SystemLogger::info("SIM800L", "Initiating voice emergency call to %s...", phoneNumber.c_str());
    String cmd = "ATD" + phoneNumber + ";";
    String res = sendATCommand(cmd, 3000, "OK");
    return (res.indexOf("OK") != -1);
}

bool SIM800LModule::hangUp() {
    String res = sendATCommand("ATH", 1000, "OK");
    return (res.indexOf("OK") != -1);
}

bool SIM800LModule::sendEmergencyMessage(const String &contact, const String &userName, float lat, float lon, const String &medicalInfo) {
    String msg = "EMERGENCY ALERT: SafeRide AI\n";
    msg += "Vehicle incident detected for " + userName + ".\n";
    msg += "Location: https://maps.google.com/?q=" + String(lat, 6) + "," + String(lon, 6) + "\n";
    if (medicalInfo.length() > 0) {
        msg += "Medical Info: " + medicalInfo + "\n";
    }
    msg += "Immediate assistance requested.";
    return sendSMS(contact, msg);
}
