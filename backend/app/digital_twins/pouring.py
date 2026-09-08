from datetime import datetime
from typing import Dict, Any
from backend.app.digital_twins.base import BaseDigitalTwin
from backend.app.db.redis import redis_manager

class PouringTwin(BaseDigitalTwin):
    def __init__(self):
        super().__init__("pouring")
        self.current_state = {
            "batch_id": "BATCH-DEFAULT",
            "ladle_id": "LADLE_1",
            "pour_temp": 1445.0,
            "pour_speed": 0.85,
            "ladle_fill_pct": 88.0,
            "flow_rate_kgps": 28.5,
            "pre_pour_risk": 0.12,
            "stage": "Pouring",
            "updated_at": datetime.now().isoformat()
        }

    async def process_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        batch_id = event.get("batch_id", self.current_state["batch_id"])
        self.current_state["batch_id"] = batch_id
        
        if "pour_temp" in event:
            self.current_state["pour_temp"] = float(event["pour_temp"])
        if "pour_speed" in event:
            self.current_state["pour_speed"] = float(event["pour_speed"])
        if "ladle_fill_pct" in event:
            self.current_state["ladle_fill_pct"] = float(event["ladle_fill_pct"])
            
        self.current_state["updated_at"] = datetime.now().isoformat()
        
        # Persist to Redis
        await redis_manager.set_digital_twin_state("pouring", batch_id, self.current_state)
        return self.current_state

    def get_state(self) -> Dict[str, Any]:
        return self.current_state

pouring_twin = PouringTwin()
