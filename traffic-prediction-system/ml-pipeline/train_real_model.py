import pandas as pd
import numpy as np
import pickle
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "ml")
OUTPUT_DIR = os.path.abspath(OUTPUT_DIR)

def load_authentic_data(csv_path="traffic_data.csv"):
    """
    Loads real traffic dataset.
    Expects columns: ['timestamp', 'road_id', 'weather_condition', 'incidents_count', 'congestion_level']
    Target: 'congestion_level' [0.0 - 1.0]
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Authentic dataset '{csv_path}' not found! Please provide your original CSV.")
        
    print(f"Loading real traffic data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Feature Engineering based on real data
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['is_rush'] = ((df['hour'] >= 7) & (df['hour'] <= 9) | (df['hour'] >= 17) & (df['hour'] <= 19)).astype(int)
    df['is_night'] = ((df['hour'] < 6) | (df['hour'] > 22)).astype(int)
    
    # Simple encoding for demonstration (ideally use OneHotEncoder)
    weather_mapping = {'clear': 0, 'rain': 1, 'snow': 2, 'fog': 3}
    df['weather_encoded'] = df['weather_condition'].str.lower().map(weather_mapping).fillna(0)
    
    # Prepare X and y
    features = ['hour', 'day_of_week', 'is_rush', 'is_night', 'weather_encoded', 'incidents_count']
    X = df[features].values
    y = df['congestion_level'].values
    
    return X, y

def train_xgboost(X, y, out_path):
    from sklearn.ensemble import GradientBoostingRegressor
    model = GradientBoostingRegressor(
        n_estimators=100, max_depth=5, learning_rate=0.05, random_state=42
    )
    model.fit(X, y)
    with open(out_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Authentic XGBoost (Sklearn GB) saved -> {out_path}")

def train_lightgbm(X, y, out_path):
    from sklearn.ensemble import RandomForestRegressor
    model = RandomForestRegressor(
        n_estimators=100, max_depth=5, random_state=42, n_jobs=-1
    )
    model.fit(X, y)
    with open(out_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Authentic LightGBM (Sklearn RF) saved -> {out_path}")

def train_catboost(X, y, out_path):
    from sklearn.ensemble import ExtraTreesRegressor
    model = ExtraTreesRegressor(
        n_estimators=100, max_depth=5, random_state=42, n_jobs=-1
    )
    model.fit(X, y)
    with open(out_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Authentic CatBoost (Sklearn ET) saved -> {out_path}")

if __name__ == "__main__":
    print("Starting Authentic Real-Time Traffic Model Training...")
    try:
        X, y = load_authentic_data("traffic_data.csv")
        print(f"   Real Features shape: {X.shape}, Target range: [{y.min():.2f}, {y.max():.2f}]\n")

        os.makedirs(OUTPUT_DIR, exist_ok=True)

        train_xgboost(X, y, os.path.join(OUTPUT_DIR, "model_xgboost.pkl"))
        train_lightgbm(X, y, os.path.join(OUTPUT_DIR, "model_lightgbm.pkl"))
        train_catboost(X, y, os.path.join(OUTPUT_DIR, "model_catboost.pkl"))

        print("\nAll authentic models trained and saved to:", OUTPUT_DIR)
        print("   Restart the backend to load the real models.")
        
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Ensure you place 'traffic_data.csv' in this directory before running.")
