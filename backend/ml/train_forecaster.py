import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report
import joblib
import httpx
import os

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering for flare prediction"""
    df["flux_log"] = np.log10(df["flux"].clip(lower=1e-9))
    df["flux_mean_1h"] = df["flux_log"].rolling(60).mean()
    df["flux_max_1h"] = df["flux_log"].rolling(60).max()
    df["flux_slope"] = df["flux_log"].diff(10)
    df["flux_accel"] = df["flux_slope"].diff(5)
    df["flux_std_30m"] = df["flux_log"].rolling(30).std()

    # Label: M+ flare (flux >= 1e-5) within next 6 hours (360 minutes)?
    # 1=yes, 0=no
    df["label"] = (df["flux_log"].rolling(360, min_periods=1)
                   .max().shift(-360) >= np.log10(1e-5)).astype(int)
    
    return df.dropna()

def get_training_data():
    print("Fetching 7-day GOES flux data...")
    url = "https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json"
    try:
        data = httpx.get(url, timeout=15.0).json()
    except Exception as e:
        print("Failed to fetch data:", e)
        # Fallback
        data = [{"time_tag": f"2024-01-01T{i//60:02d}:{i%60:02d}:00Z", "flux": 1e-8 * (1 + np.random.rand())} for i in range(7*24*60)]
    
    df = pd.DataFrame(data)
    df["flux"] = df["flux"].astype(float)
    df["time_tag"] = pd.to_datetime(df["time_tag"])
    
    print("Augmenting data to 1 year (solar cycle 25 simulation)...")
    dfs = []
    for week in range(52):
        temp_df = df.copy()
        # Add random noise
        noise = np.random.normal(0, 0.1, size=len(temp_df))
        temp_df["flux"] = temp_df["flux"] * (10 ** noise)
        
        # Inject random M/X flares to balance dataset
        if np.random.rand() > 0.5:
            flare_idx = np.random.randint(0, len(temp_df) - 60)
            flare_peak = np.random.uniform(1e-5, 5e-4) # M to X class
            for i in range(60):
                temp_df.loc[flare_idx + i, "flux"] += flare_peak * np.exp(-((i-30)**2)/100)
                
        dfs.append(temp_df)
    
    full_df = pd.concat(dfs, ignore_index=True)
    return full_df

def train():
    df = get_training_data()
    print("Engineering features...")
    df = engineer_features(df)
    
    features = ["flux_log", "flux_mean_1h", "flux_max_1h", "flux_slope", "flux_accel", "flux_std_30m"]
    X = df[features]
    y = df["label"]
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    print("Training Gradient Boosting Classifier...")
    model = GradientBoostingClassifier(n_estimators=200, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    
    print("Evaluation:")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "flare_model.pkl")
    joblib.dump({"model": model, "features": features}, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train()
