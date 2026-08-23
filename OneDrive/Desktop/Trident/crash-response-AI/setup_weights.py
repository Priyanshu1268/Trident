import os
import urllib.request
from ultralytics import YOLO

# Create weights directory if it doesn't exist
os.makedirs("weights", exist_ok=True)

print("[INFO] Initializing YOLO base model download...")

# Load base model (Ultralytics auto-downloads 'yolov8n.pt' if missing)
model = YOLO("yolov8n.pt")

# Save initial copies for all three tasks so your script runs immediately
model.save("weights/yolov8_helmet.pt")
model.save("weights/yolov8_pothole.pt")

print("[SUCCESS] All weight placeholders created in crash-response-AI/weights/")