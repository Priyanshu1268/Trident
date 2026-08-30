import numpy as np
from typing import Dict, List, Any

class FeatureExtractor:
    """
    Extracts time-window statistical features from 3-axis accelerometer and gyroscope arrays
    for Level 2 & Level 3 machine learning inference.
    """

    @staticmethod
       def extract_window_features(
           ax: List[float],
           ay: List[float],
           az: List[float],
           gx: List[float],
           gy: List[float],
           gz: List[float]
    ) -> Dict[str, float]:
        ax_arr = np.array(ax)
        ay_arr = np.array(ay)
        az_arr = np.array(az)
        gx_arr = np.array(gx)
        gy_arr = np.array(gy)
        gz_arr = np.array(gz)

        # Total acceleration vector magnitude: sqrt(ax^2 + ay^2 + az^2)
        total_acc = np.sqrt(ax_arr**2 + ay_arr**2 + az_arr**2)
        total_gyro = np.sqrt(gx_arr**2 + gy_arr**2 + gz_arr**2)

        # Jerk (rate of change of acceleration)
        jerk = np.diff(total_acc) if len(total_acc) > 1 else np.array([0.0])

        features = {
            "mean_acc": float(np.mean(total_acc)),
            "max_acc": float(np.max(total_acc)),
            "min_acc": float(np.min(total_acc)),
            "std_acc": float(np.std(total_acc)),
            "rms_acc": float(np.sqrt(np.mean(total_acc**2))),
            "max_jerk": float(np.max(np.abs(jerk))) if len(jerk) > 0 else 0.0,
            "mean_jerk": float(np.mean(np.abs(jerk))) if len(jerk) > 0 else 0.0,
            "max_gyro": float(np.max(total_gyro)),
            "std_gyro": float(np.std(total_gyro)),
            "max_pitch_rate": float(np.max(np.abs(gy_arr))),
            "max_roll_rate": float(np.max(np.abs(gx_arr))),
            "max_yaw_rate": float(np.max(np.abs(gz_arr))),
            "impact_energy": float(np.sum(total_acc**2)),
        }
        return features

    @staticmethod
    def to_feature_vector(features: Dict[str, float]) -> List[float]:
        keys = [
            "mean_acc", "max_acc", "min_acc", "std_acc", "rms_acc",
            "max_jerk", "mean_jerk", "max_gyro", "std_gyro",
            "max_pitch_rate", "max_roll_rate", "max_yaw_rate", "impact_energy"
        ]
        return [features.get(k, 0.0) for k in keys]
