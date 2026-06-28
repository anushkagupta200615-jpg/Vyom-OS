import joblib
import pandas as pd
import numpy as np
import os

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "flare_model.pkl")
model_data = None

def load_model():
    global model_data
    if model_data is None and os.path.exists(model_path):
        model_data = joblib.load(model_path)

def predict_next_6h(flux_series: list[float]) -> dict:
    load_model()
    if not model_data or len(flux_series) < 60:
        return {
            "probability": 0.0,
            "predicted_class": "UNKNOWN",
            "alert": "INSUFFICIENT DATA",
            "confidence": "LOW",
            "feature_importances": {}
        }
        
    df = pd.DataFrame({"flux": flux_series})
    df["flux_log"] = np.log10(df["flux"].clip(lower=1e-9))
    df["flux_mean_1h"] = df["flux_log"].rolling(60).mean()
    df["flux_max_1h"] = df["flux_log"].rolling(60).max()
    df["flux_slope"] = df["flux_log"].diff(10)
    df["flux_accel"] = df["flux_slope"].diff(5)
    df["flux_std_30m"] = df["flux_log"].rolling(30).std()
    
    latest = df.iloc[-1]
    features = model_data["features"]
    
    if latest[features].isna().any():
        return {
            "probability": 0.0,
            "predicted_class": "UNKNOWN",
            "alert": "INSUFFICIENT DATA",
            "confidence": "LOW",
            "feature_importances": {}
        }
    
    X = latest[features].values.reshape(1, -1)
    prob = model_data["model"].predict_proba(X)[0][1]
    
    pred_class = "M or X" if prob >= 0.5 else "A, B, or C"
    alert = "WARNING" if prob >= 0.7 else ("WATCH" if prob >= 0.4 else "NORMAL")
    confidence = "HIGH" if (prob >= 0.8 or prob <= 0.2) else "MODERATE"
    
    importances = dict(zip(features, model_data["model"].feature_importances_))
    
    return {
        "probability": float(prob),
        "predicted_class": pred_class,
        "alert": alert,
        "confidence": confidence,
        "feature_importances": importances
    }
