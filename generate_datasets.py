import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_pouring_sensor():
    print("Generating Datasets/pouring_sensor.csv...")
    pm = pd.read_csv("Datasets/production_master.csv")
    rows = []
    
    for idx, row in pm.iterrows():
        batch_id = str(row["batch_id"])
        ladle_id = str(row.get("pouring_station_id", "LADLE_1"))
        target_temp = float(row.get("target_temperature", 1400.0))
        pour_time_str = str(row.get("pour_time", "2026-03-01 08:00:00"))
        
        try:
            base_time = datetime.fromisoformat(pour_time_str)
        except Exception:
            base_time = datetime.now()
            
        # Create 10 telemetry points per pour event (0.5s intervals)
        for i in range(10):
            t = base_time + timedelta(seconds=i * 0.5)
            temp = target_temp + np.random.normal(0, 3.5)
            speed = max(0.2, min(1.5, 0.85 + np.random.normal(0, 0.05)))
            fill_pct = max(0.0, 100.0 - (i * 10.0) + np.random.normal(0, 0.5))
            flow_rate = max(5.0, 30.0 * (fill_pct / 100.0) + np.random.normal(0, 0.8))
            stage = "Setup" if i == 0 else ("Pouring" if i < 9 else "Completed")
            
            rows.append({
                "timestamp": t.isoformat(),
                "batch_id": batch_id,
                "ladle_id": ladle_id,
                "pour_temp": round(temp, 2),
                "pour_speed": round(speed, 3),
                "ladle_fill_pct": round(fill_pct, 2),
                "flow_rate_kgps": round(flow_rate, 2),
                "stage": stage
            })
            
    df = pd.DataFrame(rows)
    df.to_csv("Datasets/pouring_sensor.csv", index=False)
    print(f"Successfully generated Datasets/pouring_sensor.csv with {len(df)} rows.")

def generate_pinn_y():
    print("Generating Datasets/pinn_y.npy...")
    pinn_x = np.load("Datasets/pinn_X.npy", allow_pickle=True)
    n_samples = pinn_x.shape[0]
    
    # Paired physics target outputs: [temperature_deg_c, cooling_rate_deg_per_sec, solidification_fraction]
    temps = np.random.normal(1380.0, 45.0, size=(n_samples, 1))
    rates = np.random.normal(6.5, 1.2, size=(n_samples, 1))
    solid_frac = np.clip(np.random.beta(2, 5, size=(n_samples, 1)), 0.0, 1.0)
    
    pinn_y = np.hstack([temps, rates, solid_frac])
    np.save("Datasets/pinn_y.npy", pinn_y)
    print(f"Successfully generated Datasets/pinn_y.npy with shape {pinn_y.shape}.")

if __name__ == "__main__":
    generate_pouring_sensor()
    generate_pinn_y()
