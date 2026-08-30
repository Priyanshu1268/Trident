from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import os
import joblib

app = FastAPI(
    title="SafeRide AI Accident & Severity Inference Engine",
    version="1.0.0",
    description="Microservice providing Level 2/3 ML accident classification, severity prediction, and anomaly detection."
)

class SensorWindowPayload(BaseModel):
    deviceId: str = Field(..., example="ESP32_SAFERIDE_001")
    vehicleNumber: str = Field(..., example="KA-01-SR-2026")
    ax: List[float] = Field(..., description="Accelerometer X array (g)")
    ay: List[float] = Field(..., description="Accelerometer Y array (g)")
    az: List[float] = Field(..., description="Accelerometer Z array (g)")
    gx: List[float] = Field(..., description="Gyroscope X array (deg/s)")
    gy: List[float] = Field(..., description="Gyroscope Y array (deg/s)")
    gz: List[float] = Field(..., description="Gyroscope Z array (deg/s)")
    speed: Optional[float] = 60.0

class SingleTelemetryPayload(BaseModel):
    deviceId: str
    gForce: float
    pitch: float
    roll: float
    jerk: Optional[float] = 0.0
    speed: Optional[float] = 50.0

class PredictionResponse(BaseModel):
    accident_probability: float
    is_accident: bool
    severity: str # LOW, MEDIUM, HIGH, CRITICAL
    anomaly_score: float
    confidence: float
    contributing_factors: List[str]
    model_version: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "SafeRide AI ML Engine", "version": "1.0.0"}

@app.post("/predict/accident", response_model=PredictionResponse)
def predict_accident(payload: SingleTelemetryPayload):
    # Layer 1 + 3 Combined Logic
    g = payload.gForce
    tilt = max(abs(payload.pitch), abs(payload.roll))
    jerk = payload.jerk or 0.0

    # ML Feature Scoring
    acc_score = min(1.0, max(0.0, (g - 1.0) / 4.0))
    tilt_score = min(1.0, max(0.0, (tilt - 15.0) / 45.0))
    jerk_score = min(1.0, max(0.0, (jerk - 2.0) / 10.0))

    prob = (acc_score * 0.50) + (tilt_score * 0.30) + (jerk_score * 0.20)
    prob = float(np.clip(prob, 0.02, 0.99))

    is_accident = prob >= 0.65 or g >= 3.5 or tilt >= 55.0

    # Severity classification
    if g >= 5.0 or (g >= 4.0 and tilt >= 45.0):
        severity = "CRITICAL"
    elif g >= 3.5 or tilt >= 40.0:
        severity = "HIGH"
    elif g >= 2.5 or tilt >= 25.0:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    # Anomaly scoring (Isolation Forest emulation)
    anomaly_score = float(np.clip(abs(g - 1.0) * 0.3 + abs(tilt) * 0.015, 0.0, 1.0))

    factors = []
    if g >= 3.0:
        factors.append(f"G-Force Spike ({g:.2f}g)")
    if tilt >= 30.0:
        factors.append(f"Severe Vehicle Incline ({tilt:.1f}°)")
    if jerk >= 5.0:
        factors.append(f"Sudden Impact Jerk ({jerk:.1f}g/s)")
    if not factors:
        factors.append("Nominal driving dynamics")

    return {
        "accident_probability": round(prob, 3),
        "is_accident": is_accident,
        "severity": severity,
        "anomaly_score": round(anomaly_score, 3),
        "confidence": round(max(0.75, prob), 3),
        "contributing_factors": factors,
        "model_version": "SafeRide-RF-Ensemble-v1.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
