from datetime import datetime
from typing import Dict, Any
from backend.app.digital_twins.base import BaseDigitalTwin
from backend.app.db.redis import redis_manager

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
            "updated_at": datetime.now().isoformat()
        }

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

    def get_state(self) -> Dict[str, Any]:
        return self.current_state

melting_twin = MeltingTwin()
