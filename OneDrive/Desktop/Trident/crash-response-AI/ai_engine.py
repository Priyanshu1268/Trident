import cv2
import requests
import json
import time
from ultralytics import YOLO

# ---------------------------------------------------------
# 1. CONFIGURATION & BACKEND ENDPOINT
# ---------------------------------------------------------
BACKEND_URL = "http://localhost:8081/api/v1/telemetry"
VEHICLE_NUMBER = "KA-01-AI-2026"
LATITUDE = 28.6139
LONGITUDE = 77.2090

ALERT_COOLDOWN = 10  # seconds
last_alert_times = {"NO_HELMET": 0, "POTHOLE": 0}

# ---------------------------------------------------------
# 2. LOAD YOLO MODELS
# ---------------------------------------------------------
print("[INFO] Loading YOLO models...")
helmet_model  = YOLO("weights/yolov8_helmet.pt") 
pothole_model = YOLO("weights/yolov8_pothole.pt")

print(f"[HELMET MODEL] Classes: {helmet_model.names}")
print(f"[POTHOLE MODEL] Classes: {pothole_model.names}")

# ---------------------------------------------------------
# 3. HELPER FUNCTION: SEND TELEMETRY TO SPRING BOOT
# ---------------------------------------------------------
def send_telemetry_alert(event_type, severity, g_force=0.0):
    global last_alert_times
    current_time = time.time()
    
    if current_time - last_alert_times.get(event_type, 0) < ALERT_COOLDOWN:
        return

    payload = {
        "vehicleNumber": VEHICLE_NUMBER,
        "speed": 0.0,
        "gForce": g_force,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "impactDetected": False,
        "severity": severity
    }
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(BACKEND_URL, data=json.dumps(payload), headers=headers, timeout=2)
        print(f"[AI ALERT SENT] Event: {event_type} | Status: {response.status_code}")
        last_alert_times[event_type] = current_time
    except Exception as e:
        print(f"[ERROR] Spring Boot backend unreachable: {e}")

# ---------------------------------------------------------
# 4. MAIN CAMERA INFERENCE LOOP
# ---------------------------------------------------------
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("[ERROR] Could not open camera stream.")
    exit()

print("[INFO] Vision Engine running. Press 'q' to exit.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    helmet_detected = False

    # --- DETECTION 1: HELMET CHECK ---
    helmet_results = helmet_model(frame, stream=True, verbose=False)
    for r in helmet_results:
        for box in r.boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            label = helmet_model.names[cls_id].lower()

            if label == "helmet" and conf > 0.50:
                helmet_detected = True
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"HELMET OK ({conf:.2f})", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    # --- IF NO HELMET IS FOUND ON FRAME ---
    if not helmet_detected:
        cv2.putText(frame, "ALERT: NO HELMET DETECTED", (30, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        send_telemetry_alert("NO_HELMET", "LOW", g_force=0.0)

    # Display video output window
    cv2.imshow("CrashResponse - AI Feed", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()