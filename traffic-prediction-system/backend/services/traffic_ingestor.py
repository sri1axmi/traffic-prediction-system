import asyncio
import time
from datetime import datetime
from api.ws import manager
from ml.model_manager import predict_congestion

async def traffic_ingestion_loop():
    \"\"\"
    Background service that simulates pulling real-time traffic data,
    runs authentic predictions, and broadcasts via WebSockets.
    \"\"\"
    print("[Ingestor] Live Traffic Ingestion Service Started.")
    
    # Simulate a few major roads
    roads = [
        {"city": "New York", "area": "Manhattan", "road": "Broadway"},
        {"city": "Los Angeles", "area": "Downtown", "road": "I-110"},
        {"city": "Chicago", "area": "Loop", "road": "Lake Shore Drive"}
    ]
    
    while True:
        try:
            current_time_str = datetime.now().strftime("%H:%M")
            live_updates = []
            
            for road_info in roads:
                # In a real system, this would fetch actual speed metrics from an API/Sensor
                prediction = predict_congestion(
                    city=road_info["city"],
                    area=road_info["area"],
                    road=road_info["road"],
                    time_str=current_time_str
                )
                live_updates.append({
                    "roadInfo": road_info,
                    "prediction": prediction,
                    "timestamp": datetime.now().isoformat()
                })
                
            # Broadcast the live updates to all connected clients
            await manager.broadcast({
                "type": "LIVE_TRAFFIC_UPDATE",
                "data": live_updates
            })
            
        except Exception as e:
            print(f"[Ingestor] Error during ingestion: {e}")
            
        # Wait 10 seconds before polling the next "live" update
        await asyncio.sleep(10)
