# Hardware Wiring & Safety Guide

## ⚠️ Critical Safety Instructions

### 1. SIM800L Power Supply Requirement
> **CRITICAL WARNING:** **NEVER power the SIM800L module directly from the ESP32's 3.3V or 5V (VIN) pin.**
> 
> The SIM800L GSM module operates strictly at **3.7V - 4.4V (Optimal: 4.0V)**. When registering to cellular networks or transmitting bursts (GPRS/2G GSM), it draws transient current spikes of up to **2.0 Amps**. The ESP32 on-board low-dropout regulator (LDO) can only deliver ~500-600mA and will immediately brown-out, reset the microcontroller, or destroy the LDO.

#### Recommended Power Source for SIM800L:
- **Option A (Li-Ion Battery):** 3.7V 18650 Li-Ion or Li-Po battery (charged at 4.0V - 4.2V) connected directly to `VCC` and `GND` of SIM800L.
- **Option B (Buck Converter):** LM2596 or MP1584 step-down DC-DC buck converter adjusted to **4.0V** with a minimum rating of **3.0A**.
- **Buffer Capacitor:** Solder a **1000µF to 2200µF Low-ESR electrolytic capacitor** (parallel with a 100nF ceramic capacitor) directly across the SIM800L `VCC` and `GND` pins right next to the module.

---

### 2. Common Ground Requirement
All components (**ESP32**, **SIM800L**, **External Buck Converter / Battery**, and **MPU6050**) **MUST share a common Ground (GND)** connection. Without a shared GND reference, UART communication between ESP32 and SIM800L will fail.

---

### 3. Logic Level Consideration (UART & I2C)
- **ESP32 GPIO:** Operates at **3.3V** logic.
- **SIM800L UART:** `RXD` is rated for **2.8V - 3.3V** max.
  - ESP32 `TX` (3.3V) -> SIM800L `RXD`: Add a simple voltage divider (1kΩ and 2kΩ resistors) or a 1N4148 diode if using 5V modules, though directly connecting to 3.3V ESP32 is generally within tolerance.
  - SIM800L `TXD` -> ESP32 `RX` (3.3V): Direct connection is safe as SIM800L outputs 2.8V - 3.0V (logic HIGH recognized by ESP32).
- **MPU6050 I2C:** Most breakout boards (GY-521) have an on-board 3.3V regulator and pull-up resistors to 3.3V. Connect `VCC` to ESP32 **3.3V** or **5V** depending on your specific board's onboard LDO.

---

## 📋 Pinout & Connection Table

| Peripheral | Peripheral Pin | Connected to ESP32 Pin | Connected to Power | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **MPU6050** | VCC | - | ESP32 3.3V (or 5V for GY-521) | Power sensor |
| | GND | ESP32 GND | Shared Common GND | Ground |
| | SCL | **GPIO 22** | - | I2C Clock (configurable) |
| | SDA | **GPIO 21** | - | I2C Data (configurable) |
| | INT (optional) | **GPIO 19** | - | Motion Interrupt wake-up |
| **SIM800L** | VCC | - | **External 4.0V (2A Peak)** | **NEVER ESP32 3.3V** |
| | GND | ESP32 GND | Shared Common GND | Common Ground |
| | RXD | **GPIO 17 (TX2)** | - | ESP32 Hardware UART2 TX |
| | TXD | **GPIO 16 (RX2)** | - | ESP32 Hardware UART2 RX |
| | RST | **GPIO 4** (Optional) | - | Reset control |

---

## 🛠️ Breadboard Prototype Schematic

```
               [ 3.7V - 4.2V Li-Ion Battery / 4.0V 3A Buck Converter ]
                                   |           |
                                 (+) 4.0V     (-) GND
                                   |           |
                                   |      +----+------------------+
                                   |      | Common Ground Rail    |
                                   |      +----+--------------+---+
                                   |           |              |
                +------------------+           |              |
                |  +---------------------------+              |
                |  |                                          |
          +-----v--v-----+                             +------v-------+
          |   SIM800L    |                             |    MPU6050   |
          |  GSM Module  |                             | (Accel/Gyro) |
          +---+------+---+                             +----+-----+---+
              |      |                                      |     |
             TXD    RXD                                    SDA   SCL
              |      |                                      |     |
              |      |                                      |     |
         GPIO16     GPIO17                             GPIO21    GPIO22
        (UART_RX)  (UART_TX)                            (I2C)     (I2C)
              |      |                                      |     |
          +---v------v--------------------------------------v-----v---+
          |                      ESP32 DevKit                         |
          |                 (Microcontroller Core)                    |
          +-----------------------------+-----------------------------+
                                        |
                                   [ USB 5V ]
```

---

## 🧪 Initial Hardware Bring-Up Checklist

1. **Step 1: Check Voltages with Multimeter**
   - Measure external power supply voltage before connecting to SIM800L (Verify it reads between 3.9V and 4.1V).
2. **Step 2: Verify MPU6050 I2C Bus**
   - Run the I2C scanner sketch to confirm MPU6050 responds at address `0x68` (or `0x69` if AD0 is HIGH).
3. **Step 3: Check SIM800L LED Status**
   - Fast Blink (every 1s): Searching for cellular network.
   - Slow Blink (every 3s): Registered to GSM network successfully!
   - Rapid 800ms Blink: GPRS active.
4. **Step 4: Execute AT Test Commands in Serial Monitor (115200 Baud)**
   - Send: `AT` -> Expect: `OK`
   - Send: `AT+CSQ` -> Expect: `+CSQ: 18,0` (Signal strength > 12 is good)
   - Send: `AT+CREG?` -> Expect: `+CREG: 0,1` or `0,5` (Registered to Home/Roaming network)
