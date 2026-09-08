from datetime import datetime
from typing import Any, Dict

from backend.app.db.redis import redis_manager
from backend.app.digital_twins.base import BaseDigitalTwin


class MoldingTwin(BaseDigitalTwin):
    def __init__(self):
        super().__init__("molding")
        self.current_state = {
            "batch_id": "BATCH-DEFAULT",
            "molding_machine_id": "MOLDING_LINE_1",
            "sand_moisture": 4.2,
            "permeability": 118.0,
            "green_strength": 96.0,
            "compactability": 44.0,
            "updated_at": datetime.now().isoformat(),
        }

    async def process_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        self.current_state["batch_id"] = event.get("batch_id", self.current_state["batch_id"])
        field = event.get("measurement_type")
        value = event.get("value")
        if field in {"sand_moisture", "permeability", "green_strength", "compactability"} and value is not None:
            self.current_state[field] = float(value)
        self.current_state["updated_at"] = datetime.now().isoformat()
        await redis_manager.set_digital_twin_state("molding", self.current_state["batch_id"], self.current_state)
        return self.current_state

    async def process_row(self, row: Dict[str, Any], timestamp: str) -> Dict[str, Any]:
        event = {
            "batch_id": row.get("batch_id"),
            "molding_machine_id": row.get("molding_machine_id"),
            "timestamp": timestamp,
        }
        for field in ("sand_moisture", "permeability", "green_strength", "compactability"):
            if row.get(field) is not None:
                event["measurement_type"] = field
                event["value"] = row[field]
                await self.process_event(event)
        self.current_state["mold_id"] = str(row.get("mold_id", self.current_state.get("mold_id", "UNKNOWN")))
        self.current_state["updated_at"] = timestamp
        await redis_manager.set_digital_twin_state("molding", self.current_state["batch_id"], self.current_state)
        return self.current_state

    def get_state(self) -> Dict[str, Any]:
        return self.current_state


molding_twin = MoldingTwin()