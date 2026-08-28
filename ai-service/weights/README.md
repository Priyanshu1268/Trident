# SafeRide AI - YOLOv8 Weights Directory

This folder contains the neural network weights for the vision safety and crash prevention system:

### 1. `yolov8_helmet.pt`
- **Purpose**: Real-time rider & driver helmet compliance detection.
- **Classes**:
  - `helmet`: Safe / Protected rider.
  - `no_helmet` / `head`: Safety violation alert triggered to dash & cloud telemetry.
- **Input Resolution**: 640x640 / 320x320
- **Target Latency**: 12-25 ms on CPU / 4-8 ms on CUDA.

### 2. `yolov8_pothole.pt`
- **Purpose**: Road surface defect, pothole, and hazard detection.
- **Classes**:
  - `pothole`: Road depression / impact shock risk.
  - `crack` / `road_damage`: Road degradation alert.
- **Action**: Alerts driver HUD and logs road hazard coordinates with severity level.

### 3. `yolov8n.pt` (Base Traffic Model)
- **Purpose**: Surrounding obstacle detection (vehicles, pedestrians, cyclists).
- **Classes**: COCO 80 classes (`car`, `motorcycle`, `bus`, `truck`, `person`, `traffic light`, etc.).

---

### How to use your custom weights:
1. Place your trained `.pt` files directly into this directory:
   - `weights/yolov8_helmet.pt`
   - `weights/yolov8_pothole.pt`
   - `weights/yolov8n.pt`
2. Run the detector:
   ```bash
   python vision_yolo_detector.py
   ```
3. Live detections will automatically appear in your SafeRide AI web application dashboard at `http://localhost:3000`!
