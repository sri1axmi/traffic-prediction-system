import urllib.request
import gzip
import shutil
import pandas as pd
import os

URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00492/Metro_Interstate_Traffic_Volume.csv.gz"
GZIP_PATH = "ml-pipeline/metro_traffic.csv.gz"
RAW_CSV_PATH = "ml-pipeline/metro_traffic.csv"
FINAL_CSV_PATH = "ml-pipeline/traffic_data.csv"

def fetch_and_prepare_data():
    print(f"Downloading real traffic dataset from {URL}...")
    urllib.request.urlretrieve(URL, GZIP_PATH)
    
    print("Extracting gzip...")
    with gzip.open(GZIP_PATH, 'rb') as f_in:
        with open(RAW_CSV_PATH, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
            
    print("Processing and mapping to required schema...")
    df = pd.read_csv(RAW_CSV_PATH)
    
    # Required schema: ['timestamp', 'road_id', 'weather_condition', 'incidents_count', 'congestion_level']
    # UCI Dataset has: holiday, temp, rain_1h, snow_1h, clouds_all, weather_main, weather_description, date_time, traffic_volume
    
    mapped_df = pd.DataFrame()
    mapped_df['timestamp'] = pd.to_datetime(df['date_time'])
    mapped_df['road_id'] = 1 # Static for this dataset
    mapped_df['weather_condition'] = df['weather_main'].str.lower()
    
    # Simulate incidents count based on severe weather or random chance
    mapped_df['incidents_count'] = ((df['rain_1h'] > 5) | (df['snow_1h'] > 1)).astype(int)
    
    # Scale traffic volume (max is around ~7200 in this dataset) to [0.0 - 1.0] for congestion_level
    max_vol = df['traffic_volume'].max()
    mapped_df['congestion_level'] = df['traffic_volume'] / max_vol
    
    # Clean weather condition to match what our script expects ('clear', 'rain', 'snow', 'fog', etc)
    def map_weather(w):
        if 'clear' in w: return 'clear'
        if 'rain' in w or 'drizzle' in w or 'thunderstorm' in w: return 'rain'
        if 'snow' in w: return 'snow'
        if 'fog' in w or 'mist' in w or 'haze' in w: return 'fog'
        return 'clear' # default
        
    mapped_df['weather_condition'] = mapped_df['weather_condition'].apply(map_weather)
    
    print(f"Saving final dataset to {FINAL_CSV_PATH}...")
    mapped_df.to_csv(FINAL_CSV_PATH, index=False)
    
    # Cleanup
    os.remove(GZIP_PATH)
    os.remove(RAW_CSV_PATH)
    print("✅ Dataset fetching and preparation complete.")

if __name__ == "__main__":
    fetch_and_prepare_data()
