"""
SafeRide AI - Accident Classifier Model Training & Benchmark
Trains and benchmarks multiple algorithms:
1. Logistic Regression
2. Random Forest
3. XGBoost / Gradient Boosting
4. Support Vector Machine (SVM)
5. Multi-Layer Perceptron (MLP) Neural Network

Evaluation prioritizes RECALL (minimizing missed accidents) while balancing False Positives.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, f1_score, recall_score, precision_score
import joblib
import os

def generate_synthetic_driving_dataset(n_samples=5000):
    """
    Generates a calibrated dataset representing:
    - Normal driving (cruise, highway, stop-and-go)
    - Potholes / speed bumps (high vertical spike, low gyro change, short duration)
    - Hard braking (forward deceleration spike, zero roll)
    - Sharp turns (lateral acceleration, high yaw, moderate roll)
    - Real Collisions (high multi-axis g-force, high jerk, rotational gyro spike)
    - Rollovers (extreme roll/pitch sustained > 55 deg)
    """
    np.random.seed(42)
    
    # 70% Normal / Non-accident events
    n_normal = int(n_samples * 0.70)
    # 15% Aggressive / Road hazards (potholes, hard brakes)
    n_hazards = int(n_samples * 0.15)
    # 15% Real Accidental crashes / rollovers
    n_crashes = n_samples - n_normal - n_hazards

    # 1. Normal Driving
    acc_normal = np.random.normal(1.0, 0.12, n_normal)
    max_acc_normal = np.random.uniform(1.0, 1.6, n_normal)
    jerk_normal = np.random.exponential(1.0, n_normal)
    gyro_normal = np.random.uniform(2, 45, n_normal)
    pitch_normal = np.random.normal(0, 4, n_normal)
    roll_normal = np.random.normal(0, 3, n_normal)
    labels_normal = np.zeros(n_normal)

    # 2. Road Hazards (Braking / Potholes)
    acc_haz = np.random.uniform(1.5, 2.8, n_hazards)
    max_acc_haz = np.random.uniform(2.0, 3.2, n_hazards)
    jerk_haz = np.random.uniform(3.0, 7.5, n_hazards)
    gyro_haz = np.random.uniform(20, 120, n_hazards)
    pitch_haz = np.random.normal(8, 6, n_hazards)
    roll_haz = np.random.normal(4, 5, n_hazards)
    labels_haz = np.zeros(n_hazards) # Still False for accident

    # 3. Real Accidents (Collisions & Rollovers)
    acc_crash = np.random.uniform(3.5, 9.5, n_crashes)
    max_acc_crash = np.random.uniform(4.0, 12.0, n_crashes)
    jerk_crash = np.random.uniform(8.0, 30.0, n_crashes)
    gyro_crash = np.random.uniform(180, 520, n_crashes)
    pitch_crash = np.random.uniform(15, 80, n_crashes)
    roll_crash = np.random.uniform(20, 95, n_crashes)
    labels_crash = np.ones(n_crashes)

    # Combine
    data = pd.DataFrame({
        'mean_acc': np.concatenate([acc_normal, acc_haz, acc_crash]),
        'max_acc': np.concatenate([max_acc_normal, max_acc_haz, max_acc_crash]),
        'jerk': np.concatenate([jerk_normal, jerk_haz, jerk_crash]),
        'max_gyro': np.concatenate([gyro_normal, gyro_haz, gyro_crash]),
        'pitch': np.concatenate([pitch_normal, pitch_haz, pitch_crash]),
        'roll': np.concatenate([roll_normal, roll_haz, roll_crash]),
        'label': np.concatenate([labels_normal, labels_haz, labels_crash])
    })
    return data

def train_and_evaluate():
    print("=== SafeRide AI Model Training Pipeline ===")
    df = generate_synthetic_driving_dataset(6000)

    X = df[['mean_acc', 'max_acc', 'jerk', 'max_gyro', 'pitch', 'roll']]
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "Logistic Regression": LogisticRegression(class_weight='balanced'),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42),
        "Support Vector Machine": SVC(probability=True, class_weight='balanced', random_state=42),
        "Neural Network (MLP)": MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=300, random_state=42)
    }

    results = {}
    best_model = None
    best_f1 = 0.0

    for name, model in models.items():
        print(f"\n--- Training {name} ---")
        X_tr = X_train_scaled if "Logistic" in name or "Support" in name or "Neural" in name else X_train
        X_te = X_test_scaled if "Logistic" in name or "Support" in name or "Neural" in name else X_test

        model.fit(X_tr, y_train)
        y_pred = model.predict(X_te)
        y_prob = model.predict_proba(X_te)[:, 1] if hasattr(model, "predict_proba") else y_pred

        rec = recall_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_prob)

        print(f"Recall: {rec:.4f} | Precision: {prec:.4f} | F1-Score: {f1:.4f} | ROC-AUC: {auc:.4f}")
        results[name] = {"recall": rec, "precision": prec, "f1": f1, "auc": auc}

        if f1 > best_f1:
            best_f1 = f1
            best_model = (name, model, scaler)

    print(f"\n🏆 Champion Model: {best_model[0]} (F1-Score: {best_f1:.4f})")
    
    os.makedirs("../models", exist_ok=True)
    joblib.dump(best_model[1], "../models/accident_classifier.pkl")
    joblib.dump(best_model[2], "../models/scaler.pkl")
    print("Model serialized to ../models/accident_classifier.pkl successfully.")

if __name__ == "__main__":
    train_and_evaluate()
