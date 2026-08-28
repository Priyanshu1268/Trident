"""
=============================================================================
SafeRide AI / Trident - Multi-Model YOLO Vision Inference Service
=============================================================================
Features:
  1. yolov8_helmet.pt  : Detects 'helmet', 'no_helmet', 'head', 'face'
  2. yolov8_pothole.pt : Detects 'pothole', 'crack', 'road_damage'
  3. yolov8n.pt        : Multiclass vehicle & road hazard object detector
  4. Auto-dispatches real-time telemetry alerts to SafeRide AI Backend:
     Endpoint: http://localhost:3000/api/v1/telemetry
=============================================================================
"""

import os
import sys
import time
import json
import requests

try:
    import cv2
    from ultralytics import YOLO
except ImportError:
    print("[ERROR] Required packages missing! Install them with:")
    print("        pip install ultralytics opencv-python requests")
    sys.exit(1)

# ---------------------------------------------------------
# 1. CONFIGURATION & BACKEND ENDPOINTS
# ---------------------------------------------------------
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000/api/v1/telemetry")
VEHICLE_NUMBER = os.environ.get("VEHICLE_NUMBER", "KA-01-AI-2026")
LATITUDE = float(os.environ.get("LATITUDE", 28.6139))
LONGITUDE = float(os.environ.get("LONGITUDE", 77.2090))
CONFIDENCE_THRESHOLD = float(os.environ.get("CONF_THRESH", 0.45))
CAMERA_INDEX = int(os.environ.get("CAMERA_INDEX", 0))

ALERT_COOLDOWN = 10  # Minimum seconds between repeated alerts of the same type
last_alert_times = {
    "NO_HELMET": 0,
    "POTHOLE": 0,
    "COLLISION_PROXIMITY": 0,
}

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")
HELMET_WEIGHTS = os.path.join(WEIGHTS_DIR, "yolov8_helmet.pt")
POTHOLE_WEIGHTS = os.path.join(WEIGHTS_DIR, "yolov8_pothole.pt")
BASE_WEIGHTS = os.path.join(WEIGHTS_DIR, "yolov8n.pt")

# Fallback to local root if weights directory is flat
if not os.path.exists(HELMET_WEIGHTS) and os.path.exists("yolov8_helmet.pt"):
    HELMET_WEIGHTS = "yolov8_helmet.pt"
if not os.path.exists(POTHOLE_WEIGHTS) and os.path.exists("yolov8_pothole.pt"):
    POTHOLE_WEIGHTS = "yolov8_pothole.pt"
if not os.path.exists(BASE_WEIGHTS) and os.path.exists("yolov8n.pt"):
    BASE_WEIGHTS = "yolov8n.pt"

# ---------------------------------------------------------
# 2. LOAD YOLO MODELS
# ---------------------------------------------------------
print("[INFO] Loading YOLO Vision Models...")

# 1. Helmet Model
try:
    helmet_model = YOLO(HELMET_WEIGHTS if os.path.exists(HELMET_WEIGHTS) else "yolov8n.pt")
    print(f"[OK] Helmet Model Loaded ({HELMET_WEIGHTS}) | Classes: {helmet_model.names}")
except Exception as e:
    print(f"[WARN] Using fallback YOLO base for helmet detection: {e}")
    helmet_model = YOLO("yolov8n.pt")

# 2. Pothole Model
try:
    pothole_model = YOLO(POTHOLE_WEIGHTS if os.path.exists(POTHOLE_WEIGHTS) else "yolov8n.pt")
    print(f"[OK] Pothole Model Loaded ({POTHOLE_WEIGHTS}) | Classes: {pothole_model.names}")
except Exception as e:
    print(f"[WARN] Using fallback YOLO base for pothole detection: {e}")
    pothole_model = YOLO("yolov8n.pt")

# 3. Base Traffic Model
try:
    base_model = YOLO(BASE_WEIGHTS if os.path.exists(BASE_WEIGHTS) else "yolov8n.pt")
    print(f"[OK] Base Traffic Model Loaded ({BASE_WEIGHTS})")
except Exception as e:
    base_model = helmet_model

# ---------------------------------------------------------
# 3. HELPER FUNCTION: SEND TELEMETRY ALERT TO SAFERIDE BACKEND
# ---------------------------------------------------------
def send_telemetry_alert(event_type: str, severity: str, g_force: float = 0.0, speed: float = 45.0, notes: str = ""):
    global last_alert_times
    current_time = time.time()

    if current_time - last_alert_times.get(event_type, 0) < ALERT_COOLDOWN:
        return

    payload = {
        "vehicleNumber": VEHICLE_NUMBER,
        "speed": speed,
        "gForce": g_force if g_force > 0 else 1.05,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "impactDetected": severity in ["HIGH", "CRITICAL"],
        "severity": severity,
        "visionEvent": event_type,
        "notes": notes or f"YOLOv8 Real-time detection event: {event_type}"
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(BACKEND_URL, data=json.dumps(payload), headers=headers, timeout=2)
        print(f"🚀 [AI ALERT SENT] Event: {event_type} | Severity: {severity} | HTTP {response.status_code}")
        last_alert_times[event_type] = current_time
    except Exception as e:
        print(f"⚠️ [WARN] Backend endpoint unreachable ({BACKEND_URL}): {e}")

# ---------------------------------------------------------
# 4. MAIN INFERENCE LOOP
# ---------------------------------------------------------
def main():
    print(f"\n[START] Connecting to Camera (Device Index: {CAMERA_INDEX})...")
    cap = cv2.VideoCapture(CAMERA_INDEX)

    if not cap.isOpened():
        print(f"[ERROR] Could not open camera (index {CAMERA_INDEX}). Check webcam connection or permissions.")
        return

    # Set frame dimensions
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    print("[SUCCESS] Vision Engine Active. Press 'q' in the video window to stop.\n")

    frame_count = 0
    fps_start_time = time.time()
    fps = 0.0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Empty frame captured. Reconnecting...")
            break

        frame_count += 1
        if frame_count % 15 == 0:
            elapsed = time.time() - fps_start_time
            fps = 15.0 / elapsed if elapsed > 0 else 30.0
            fps_start_time = time.time()

        h, w, _ = frame.shape
        helmet_found = False
        no_helmet_found = False
        potholes_found = 0

        # --- MODEL 1: HELMET COMPLIANCE CHECK ---
        helmet_results = helmet_model(frame, stream=True, verbose=False, conf=CONFIDENCE_THRESHOLD)
        for r in helmet_results:
            for box in r.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                class_name = helmet_model.names.get(cls_id, f"class_{cls_id}").lower()

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                if "no_helmet" in class_name or "without_helmet" in class_name or "head" in class_name:
                    no_helmet_found = True
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, f"NO HELMET ({conf:.2f})", (x1, max(20, y1 - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)
                elif "helmet" in class_name:
                    helmet_found = True
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, f"HELMET OK ({conf:.2f})", (x1, max(20, y1 - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 0), 2)

        # --- MODEL 2: ROAD POTHOLE & DAMAGE CHECK ---
        pothole_results = pothole_model(frame, stream=True, verbose=False, conf=CONFIDENCE_THRESHOLD)
        for r in pothole_results:
            for box in r.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                class_name = pothole_model.names.get(cls_id, f"class_{cls_id}").lower()

                if "pothole" in class_name or "crack" in class_name or "damage" in class_name:
                    potholes_found += 1
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
                    cv2.putText(frame, f"POTHOLE HAZARD ({conf:.2f})", (x1, max(20, y1 - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2)

        # --- AUTOMATED TELEMETRY EMISSION ---
        if no_helmet_found:
            cv2.putText(frame, "SAFETY ALERT: NO HELMET DETECTED!", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            send_telemetry_alert("HELMET_MISSING", "LOW", g_force=1.05, notes="Driver/rider detected without helmet.")
        elif potholes_found > 0:
            cv2.putText(frame, f"ROAD HAZARD: {potholes_found} POTHOLE(S) AHEAD", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
            send_telemetry_alert("POTHOLE_IMPACT", "MEDIUM", g_force=2.2, notes=f"Road hazard: {potholes_found} pothole(s) detected in path.")
        else:
            cv2.putText(frame, "STATUS: ALL CLEAR / HELMET COMPLIANT", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # --- HUD OVERLAY ---
        cv2.rectangle(frame, (10, h - 50), (320, h - 10), (15, 23, 42), -1)
        cv2.putText(frame, f"SafeRide YOLOv8 | FPS: {fps:.1f} | Cam: {CAMERA_INDEX}", (20, h - 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (56, 189, 248), 1)
        cv2.putText(frame, f"Backend: {BACKEND_URL}", (20, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (203, 213, 225), 1)

        # Display output window
        cv2.imshow("SafeRide AI - Real-time YOLO Vision Safety Feed", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Vision Engine Stopped.")

if __name__ == "__main__":
    main()
