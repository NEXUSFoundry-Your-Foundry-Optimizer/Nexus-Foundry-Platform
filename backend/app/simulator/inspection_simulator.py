import asyncio
from datetime import datetime
import logging
from typing import Optional

from backend.app.simulator.dataset_loader import dataset_loader
from backend.app.mqtt.publisher import mqtt_publisher

logger = logging.getLogger("InspectionSimulator")

class InspectionSimulator:
    async def simulate_inspection(self, batch_id: Optional[str] = None):
        try:
            df = dataset_loader.load_csv("inspection_labels.csv")
            if batch_id:
                df = df[df["batch_id"] == batch_id]
                
            for _, row in df.iterrows():
                event = {
                    "batch_id": row.get("batch_id"),
                    "image_id": row.get("image_id"),
                    "defect_present": bool(row.get("defect_present", False)),
                    "defect_type": str(row.get("defect_type", "none")),
                    "severity": int(row.get("severity", 0)),
                    "inspection_result": str(row.get("inspection_result", "PASS")),
                    "timestamp": datetime.now().isoformat()
                }
                await mqtt_publisher.publish("foundry/inspections", event)
                await asyncio.sleep(0.5)
        except Exception as e:
            logger.error(f"Error simulating inspection events: {e}")

inspection_simulator = InspectionSimulator()
