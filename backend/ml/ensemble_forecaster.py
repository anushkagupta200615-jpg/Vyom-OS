"""
Ensemble Forecaster: GradientBoosting + RandomForest + MLP
Trains on augmented GOES data simulating a full solar cycle.
"""
import httpx
import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

GOES_7DAY = "https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "ensemble_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

def fetch_goes_data():
    print("Fetching 7-day GOES flux data...")
    try:
        r = httpx.get(GOES_7DAY, timeout=20)
        data = r.json()
        df = pd.DataFrame(data)
        df = df[df['energy'] == '0.1-0.8nm'][['time_tag', 'flux']].dropna()
        df['time_tag'] = pd.to_datetime(df['time_tag'])
        df['flux'] = pd.to_numeric(df['flux'], errors='coerce').fillna(1e-9)
        df = df.set_index('time_tag').sort_index()
        return df
    except Exception as e:
        print(f"Error fetching GOES data: {e}")
        return None

def augment_to_solar_cycle(df: pd.DataFrame) -> pd.DataFrame:
    """Augment 7 days of data to simulate a 1-year solar cycle."""
    print("Augmenting data to 1 year (solar cycle simulation)...")
    cycles = []
    base = df.copy()
    for i in range(52):  # ~52 weeks to make ~1 year
        noisy = base.copy()
        # Simulate solar cycle intensity variation
        cycle_intensity = 1 + 0.5 * np.sin(2 * np.pi * i / 52)
        noisy['flux'] = noisy['flux'] * cycle_intensity * np.random.lognormal(0, 0.3, len(noisy))
        cycles.append(noisy)
    return pd.concat(cycles).reset_index(drop=True)

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create lag, rolling, and derivative features."""
    print("Engineering features...")
    flux = df['flux'].values
    features = {
        'flux': flux,
        'log_flux': np.log10(np.maximum(flux, 1e-10)),
        'lag_1': np.roll(flux, 1),
        'lag_5': np.roll(flux, 5),
        'lag_12': np.roll(flux, 12),
        'rolling_mean_12': pd.Series(flux).rolling(12, min_periods=1).mean().values,
        'rolling_std_12': pd.Series(flux).rolling(12, min_periods=1).std().fillna(0).values,
        'rolling_max_12': pd.Series(flux).rolling(12, min_periods=1).max().values,
        'delta_1': np.gradient(flux),
        'delta_5': np.gradient(flux, 5),
        'flux_class': (flux >= 1e-5).astype(int),  # M+ class threshold
    }
    feat_df = pd.DataFrame(features)
    # Target: M+ class flare in next 6 hours (72 x 5-min samples)
    feat_df['label'] = (pd.Series(flux).rolling(72).max().shift(-72) >= 1e-5).astype(int).values
    return feat_df.dropna()

def train():
    df = fetch_goes_data()
    if df is None or len(df) < 100:
        # Fallback: generate synthetic data
        print("Using synthetic fallback data...")
        n = 8640  # 1 year of 1-minute data
        t = np.linspace(0, 365, n)
        flux = 1e-8 * (1 + 2 * np.sin(2 * np.pi * t / 27)) + np.random.lognormal(-1, 1, n) * 1e-9
        df = pd.DataFrame({'flux': flux})
    else:
        df = augment_to_solar_cycle(df)

    feat_df = engineer_features(df)
    X = feat_df.drop(columns=['label', 'flux', 'flux_class']).values
    y = feat_df['label'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    print("Training Ensemble (GradientBoosting + RandomForest + MLP)...")
    gb = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, n_jobs=-1)
    mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=200, random_state=42)

    ensemble = VotingClassifier(
        estimators=[('gb', gb), ('rf', rf), ('mlp', mlp)],
        voting='soft'
    )
    ensemble.fit(X_train, y_train)

    print("Evaluation:")
    y_pred = ensemble.predict(X_test)
    print(classification_report(y_test, y_pred))

    joblib.dump(ensemble, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"Ensemble saved to {MODEL_PATH}")

if __name__ == "__main__":
    train()
