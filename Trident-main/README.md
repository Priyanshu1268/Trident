# SafeRide AI — Autonomous Vehicle Accident Detection & Emergency Response Platform

An end-to-end IoT, AI, and emergency response system connecting physical embedded hardware (ESP32, MPU6050, SIM800L, Buzzer, SOS Switch) with a real-time web monitoring and multi-tier emergency dispatch platform.

---

## 🚀 System Architecture

```
                                  [ PHYSICAL HARDWARE ]
                     +----------------------------------------------+
                     | ESP32 Microcontroller (NodeMCU-32S)          |
                     | ├─ MPU6050 6-Axis IMU (I2C GPIO 21/22)       |
                     | ├─ SIM800L GSM Modem (UART GPIO 16/17)       |
                     | ├─ Active Siren Buzzer (GPIO 23)             |
                     | ├─ Physical Emergency SOS Button (GPIO 18)   |
                     | └─ Li-Ion / DC-DC 4.0V 3A Power Subsystem    |
                     +----------------------+-----------------------+
                                            |
                         (WebSerial USB / REST / MQTT)
                                            |
                                            v
                                [ SAFERIDE CLOUD / EDGE ]
                     +----------------------------------------------+
                     | Full-Stack Node.js / Express / TypeScript    |
                     | ├─ Real-Time SSE Ingestion & Broadcast       |
                     | ├─ 30s Driver False-Alarm Cancellation Engine|
                     | ├─ Multi-Tier Escalation Dispatcher (SMS/Call|
                     | └─ In Case of Emergency (ICE) Medical Pass   |
                     +----------------------+-----------------------+
                                            |
                                            v
                                   [ AI / ML ENGINE ]
                     +----------------------------------------------+
                     | FastAPI ML Microservice (Python)             |
                     | ├─ Kinematic Feature Extractor (500ms window)|
                     | ├─ Random Forest Impact Classifier           |
                     | ├─ Pothole & Bump False-Positive Filter      |
                     | └─ Vision AI (Helmet & Road Hazard Detector) |
                     +----------------------------------------------+
```

---

## 🛠️ Hardware Wiring & Breadboard Connections

### Pinout Table

| Component | Pin | Connected To | Description |
| :--- | :--- | :--- | :--- |
| **MPU-6050** | `VCC` | ESP32 `3V3` | 3.3V Power |
| | `GND` | Common Ground Rail | Shared Ground |
| | `SCL` | ESP32 `GPIO 22` | I2C Clock |
| | `SDA` | ESP32 `GPIO 21` | I2C Data |
| | `INT` | ESP32 `GPIO 19` | Hardware motion interrupt (optional) |
| **SIM800L** | `VCC / NET` | **External 4.0V 2A Rail** | Dedicated battery / buck converter output (**NEVER ESP32 3.3V/5V**) |
| | `GND` | Common Ground Rail | **Shared Ground with ESP32 GND** |
| | `TXD` | ESP32 `GPIO 16 (RX2)` | Hardware UART2 RX |
| | `RXD` | ESP32 `GPIO 17 (TX2)` | Hardware UART2 TX (via 1kΩ/2kΩ divider) |
| **Buzzer** | `Positive (+)` | ESP32 `GPIO 23` | Active alarm output |
| | `Negative (-)` | Common Ground Rail | Ground |
| **SOS Button** | `Leg 1` | ESP32 `3V3` | 3.3V pull-up |
| | `Leg 2` | ESP32 `GPIO 18` + 10kΩ GND | Digital input with pull-down resistor |

> Detailed diagrams and safety specs are available in `/hardware/wiring.md` and `/hardware/bill-of-materials.md`.

---

## 🧠 AI / ML Engine & Pothole Classification

The ML pipeline is trained on 6-axis kinematic time-series to classify vehicular dynamics:
- **Random Forest Classifier** (`n_estimators=100`, `max_depth=8`)
- **Extracted Features**: Resultant $g$-force magnitude, rate of change ($\text{jerk}$ $dg/dt$), angular velocity ($\omega_{gyro}$), roll/pitch stability.
- **Pothole Rejection**: Vertical spikes ($a_z \approx 1.8g - 3.2g$, $<50\text{ms}$) with low angular tilt ($\Delta\theta < 8^\circ$) are classified as non-accident road hazards to eliminate false emergency calls.
- **Computer Vision Monitor**: Dashcam/helmet stream hazard analysis detecting helmets and road surface depressions.

---

## 💻 Repository Structure

- `/firmware/`: Complete C++ PlatformIO/Arduino sketch (`main.cpp`, `AccidentDetector.h`, `SIM800LModule.h`).
- `/hardware/`: Wiring schematics, breadboard layout, and Bill of Materials (BOM).
- `/ai-service/`: FastAPI Python microservice with model training script (`train_accident_model.py`).
- `/src/`: React 18, TypeScript, and Tailwind CSS client application.
- `/server.ts`: Express backend with real-time SSE stream, emergency dispatch engine, and REST API.
- `/docker-compose.yml`: Multi-container deployment configuration.

