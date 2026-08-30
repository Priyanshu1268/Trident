import os
import sys

def setup_weights():
    weights_dir = os.path.join(os.path.dirname(__file__), "weights")
    os.makedirs(weights_dir, exist_ok=True)
    print(f"[INFO] Initializing YOLO weights in directory: {weights_dir}")

    try:
        from ultralytics import YOLO
        print("[INFO] Ultralytics is installed. Downloading/verifying base yolov8n.pt model...")
        
        # Load base model (Ultralytics auto-downloads 'yolov8n.pt' if missing)
        base_model = YOLO("yolov8n.pt")
        
        # Save copies for all three model tasks
        helmet_path = os.path.join(weights_dir, "yolov8_helmet.pt")
        pothole_path = os.path.join(weights_dir, "yolov8_pothole.pt")
        base_path = os.path.join(weights_dir, "yolov8n.pt")
        
        base_model.save(base_path)
        print(f"[OK] Saved base object detection model: {base_path}")
        
        if not os.path.exists(helmet_path):
            base_model.save(helmet_path)
            print(f"[OK] Initialized helmet model placeholder: {helmet_path}")
            
        if not os.path.exists(pothole_path):
            base_model.save(pothole_path)
            print(f"[OK] Initialized pothole model placeholder: {pothole_path}")
            
        print("\n[SUCCESS] All 3 YOLO models ready in weights/:")
        print("  1. weights/yolov8n.pt       (Base Traffic & Vehicle Detection)")
        print("  2. weights/yolov8_helmet.pt  (Helmet Compliance Detection)")
        print("  3. weights/yolov8_pothole.pt (Pothole & Road Hazard Detection)")
        print("\nTip: If you have your own custom-trained .pt weights, simply replace the files in the weights/ folder!")
        
    except ImportError:
        print("[WARNING] 'ultralytics' package not found in this environment.")
        print("[INFO] Run: pip install ultralytics opencv-python requests")
        # Create empty placeholder files if ultralytics is not available
        for fname in ["yolov8n.pt", "yolov8_helmet.pt", "yolov8_pothole.pt"]:
            p = os.path.join(weights_dir, fname)
            if not os.path.exists(p):
                with open(p, "wb") as f:
                    f.write(b"YOLOv8_WEIGHTS_PLACEHOLDER")
                print(f"[CREATED] Created placeholder: {p}")

if __name__ == "__main__":
    setup_weights()
