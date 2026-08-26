# SafeRide AI — Bill of Materials (BOM)

## Core Prototype Components

| Item # | Component | Model / Spec | Quantity | Estimated Cost | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Microcontroller | ESP32-WROOM-32 (38-Pin / 30-Pin) | 1 | $4.50 | Edge sensor processing & telemetry |
| 2 | IMU Sensor | MPU6050 6-Axis (GY-521 Breakout) | 1 | $1.80 | Acceleration ($a_x, a_y, a_z$) & Gyro ($g_x, g_y, g_z$) |
| 3 | Cellular Modem | SIM800L GPRS / GSM Module | 1 | $4.20 | SMS & Call fallback emergency dispatch |
| 4 | Power Supply | LM2596 DC-DC Buck Converter (3A) or 18650 Battery | 1 | $2.50 | 4.0V peak 2A power for SIM800L |
| 5 | Buffer Capacitor | 1000µF - 2200µF 16V Low-ESR Electrolytic | 1 | $0.30 | Absorbs GSM RF transmission current spikes |
| 6 | Breadboard | 830-Point Solderless Breadboard | 1 | $2.50 | Rapid prototyping & wiring |
| 7 | Jumper Wires | Male-to-Male & Male-to-Female Kit | 1 | $2.00 | Interconnections |
| 8 | Smartphone | Android / iOS running SafeRide PWA | 1 | Existing | High-accuracy GPS, cancellation UI, audio alarm |
| 9 | SIM Card | 2G/GSM Compatible Micro-SIM with SMS pack | 1 | ~$3.00 | Cellular connectivity |

## Future Expansion Modules (Phase 2)
- **NEO-6M GPS Module**: Dedicated on-board satellite positioning.
- **Piezo Buzzer (5V Active)**: In-cabin 85dB audible countdown warning.
- **RGB Status LED**: Visual state indicators (Green: Normal, Amber: Warning, Red: Confirmed).
- **0.96" I2C OLED Display (SSD1306)**: Standalone telemetry & device status screen.
- **Emergency SOS Push Button**: Physical manual driver distress trigger.
- **Vibration Sensor (SW-420)**: Secondary mechanical impact confirmation.
