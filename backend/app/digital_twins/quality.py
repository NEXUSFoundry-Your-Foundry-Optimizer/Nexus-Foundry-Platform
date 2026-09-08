from datetime import datetime
from typing import Dict, Any
from backend.app.digital_twins.base import BaseDigitalTwin
from backend.app.db.redis import redis_manager

class QualityTwin(BaseDigitalTwin):
    def __init__(self):
        super().__init__("quality")
        self.current_state = {
            "batch_id": "BATCH-DEFAULT",
            "defect_present": False,
            "defect_type": "none",
            "severity": 0,
            "inspection_result": "PASS",
            "quality_score": 0.98,
            "defect_risk": 0.02,
            "shap_summary": {"melt_temp": 0.05, "vibration": 0.02},
            "updated_at": datetime.now().isoformat()
        }

    async def process_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        batch_id = event.get("batch_id", self.current_state["batch_id"])
        self.current_state["batch_id"] = batch_id
        
        if "defect_present" in event:
            value = event["defect_present"]
            self.current_state["defect_present"] = value if isinstance(value, bool) else str(value).lower() == "true"
        if "defect_type" in event:
            self.current_state["defect_type"] = str(event["defect_type"])
        if "inspection_result" in event:
            self.current_state["inspection_result"] = str(event["inspection_result"])
        if "defect_risk" in event:
            self.current_state["defect_risk"] = float(event["defect_risk"])
        if "severity" in event:
            self.current_state["severity"] = int(event["severity"])
        if "image_id" in event:
            self.current_state["image_id"] = str(event["image_id"])
            
        self.current_state["updated_at"] = datetime.now().isoformat()
        
        # Persist to Redis
        await redis_manager.set_digital_twin_state("quality", batch_id, self.current_state)
        return self.current_state

    def get_state(self) -> Dict[str, Any]:
        return self.current_state

quality_twin = QualityTwin()
