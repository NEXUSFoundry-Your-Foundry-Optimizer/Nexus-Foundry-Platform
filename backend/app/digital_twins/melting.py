from datetime import datetime
from collections import deque
from typing import Dict, Any
from backend.app.digital_twins.base import BaseDigitalTwin
from backend.app.db.redis import redis_manager
from backend.app.ml.lstm_autoencoder import lstm_autoencoder
from backend.app.ml.tft import tft_model
from backend.app.simulator.dataset_loader import dataset_loader

class MeltingTwin(BaseDigitalTwin):
    def __init__(self):
        super().__init__("melting")
        self.current_state = {
            "batch_id": "BATCH-DEFAULT",
            "furnace_id": "FURNACE_1",
            "melt_temp": 1380.0,
            "power_kw": 800.0,
            "vibration_g": 0.03,
            "lining_health": 0.85,
            "operating_state": "Melting",
            "cooling_water_inlet_temp": 18.5,
            "cooling_water_outlet_temp": 32.0,
            "anomaly_score": 0.05,
            "anomaly_flag": False,
            "anomaly_type": "normal",
            "anomaly_severity": 0.0,
            "forecast": [],
            "updated_at": datetime.now().isoformat()
        }
        self.sensor_history: deque[Dict[str, float]] = deque(maxlen=168)
        self.last_forecast_at = 0.0

    async def process_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        batch_id = event.get("batch_id", self.current_state["batch_id"])
        self.current_state["batch_id"] = batch_id
        
        m_type = event.get("measurement_type")
        val = event.get("value")
        
        if m_type == "melt_temp" and val is not None:
            self.current_state["melt_temp"] = float(val)
        elif m_type == "power_kw" and val is not None:
            self.current_state["power_kw"] = float(val)
        elif m_type == "vibration_g" and val is not None:
            self.current_state["vibration_g"] = float(val)
        elif m_type == "lining_health_index" and val is not None:
            self.current_state["lining_health"] = float(val)
            
        if "operating_state" in event:
            self.current_state["operating_state"] = event["operating_state"]
            
        self.current_state["updated_at"] = datetime.now().isoformat()
        
        # Persist to Redis
        await redis_manager.set_digital_twin_state("melting", batch_id, self.current_state)
        return self.current_state

    async def process_row(self, row: Dict[str, Any], timestamp: str) -> Dict[str, Any]:
        """Update one source row atomically and run furnace models on the latest window."""
        numeric_fields = (
            "melt_temp", "power_kw", "vibration_g", "lining_health_index",
            "cooling_water_inlet_temp", "cooling_water_outlet_temp",
        )
        self.current_state.update({
            "batch_id": str(row.get("batch_id", self.current_state["batch_id"])),
            "furnace_id": str(row.get("furnace_id", self.current_state["furnace_id"])),
            "operating_state": str(row.get("operating_state", self.current_state["operating_state"])),
            "updated_at": timestamp,
        })
        features: Dict[str, float] = {}
        for field in numeric_fields:
            if row.get(field) is not None:
                value = float(row[field])
                features[field] = value
                state_field = "lining_health" if field == "lining_health_index" else field
                self.current_state[state_field] = value
        self.sensor_history.append(features)
        detection = lstm_autoencoder.detect_anomaly([{"features": item} for item in self.sensor_history])
        self.current_state.update({
            "anomaly_score": detection.get("anomaly_score", 0.0),
            "anomaly_flag": detection.get("is_anomaly", False),
            "anomaly_severity": detection.get("anomaly_score", 0.0),
            "anomaly_type": "sensor_reconstruction_error" if detection.get("is_anomaly") else "normal",
        })
        forecast_at = self.current_state.get("forecast", {}).get("generated_at") if isinstance(self.current_state.get("forecast"), dict) else None
        hours_since_forecast = (datetime.fromisoformat(timestamp) - datetime.fromisoformat(forecast_at)).total_seconds() / 3600 if forecast_at else None
        if detection.get("is_anomaly") or not self.current_state["forecast"] or (hours_since_forecast is not None and hours_since_forecast >= 1):
            forecast = tft_model.forecast(
                current_temp=self.current_state["melt_temp"],
                lining_health=self.current_state["lining_health"],
                horizon_hours=48,
                forecast_at=timestamp,
                history=list(self.sensor_history),
            )
            self.current_state["forecast"] = {**forecast, "generated_at": timestamp}
        await redis_manager.set_digital_twin_state("melting", self.current_state["batch_id"], self.current_state)
        return self.current_state

    @staticmethod
    def get_next_pour_schedule(batch_id: str, source_time: datetime) -> Dict[str, Any] | None:
        for row in dataset_loader.load_csv("production_master.csv").to_dict(orient="records"):
            if str(row.get("batch_id")) != batch_id or not row.get("pour_time"):
                continue
            pour_time = datetime.fromisoformat(str(row["pour_time"]))
            hours_until_pour = (pour_time - source_time).total_seconds() / 3600
            if 0 <= hours_until_pour <= 12:
                return {"batch_id": batch_id, "time": pour_time.isoformat(), "hours_until_pour": round(hours_until_pour, 2), "part_name": row.get("part_name"), "mold_id": row.get("mold_id")}
        return None

    def get_state(self) -> Dict[str, Any]:
        return self.current_state

melting_twin = MeltingTwin()
