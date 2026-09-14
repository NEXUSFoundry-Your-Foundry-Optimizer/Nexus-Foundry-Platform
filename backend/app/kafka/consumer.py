import asyncio
import json
import logging
from typing import Optional
from aiokafka import AIOKafkaConsumer
from backend.app.config import settings
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.molding import molding_twin
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.digital_twins.quality import quality_twin
from backend.app.websocket.manager import ws_manager

logger = logging.getLogger("KafkaConsumer")

class KafkaConsumerClient:
    """
    Active AIOKafka Consumer loop for ingesting event streams from Kafka event bus
    and routing them to Digital Twins & real-time WebSocket clients.
    """
    def __init__(self):
        self.consumer: Optional[AIOKafkaConsumer] = None
        self._task: Optional[asyncio.Task] = None
        self.running = False

    async def start(self):
        try:
            self.consumer = AIOKafkaConsumer(
                "foundry.sensors.telemetry",
                "foundry.sensors.furnace",
                "foundry.sensors.molding",
                "foundry.sensors.pouring",
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                group_id="nexus-twin-ingestion-group",
                auto_offset_reset="latest",
                value_deserializer=lambda v: json.loads(v.decode("utf-8"))
            )
            await asyncio.wait_for(self.consumer.start(), timeout=2.0)
            self.running = True
            self._task = asyncio.create_task(self._consume_loop())
            logger.info("AIOKafkaConsumer started and subscribed to sensor topics")
        except Exception as e:
            logger.warning(f"Kafka consumer start failed ({e}). Operating in in-memory stream mode.")
            self.running = False

    async def _consume_loop(self):
        if not self.consumer:
            return
        try:
            async for msg in self.consumer:
                if not self.running:
                    break
                topic = msg.topic
                payload = msg.value
                batch_id = payload.get("batch_id", "latest")
                
                if "furnace" in topic:
                    state = await melting_twin.process_event(payload)
                    await ws_manager.broadcast_digital_twin_update(batch_id, state, twin="melting")
                elif "molding" in topic:
                    state = await molding_twin.process_event(payload)
                    await ws_manager.broadcast_digital_twin_update(batch_id, state, twin="molding")
                elif "pouring" in topic:
                    state = await pouring_twin.process_event(payload)
                    await ws_manager.broadcast_digital_twin_update(batch_id, state, twin="pouring")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in Kafka consume loop: {e}")

    async def stop(self):
        self.running = False
        if self._task and not self._task.done():
            self._task.cancel()
        if self.consumer:
            await self.consumer.stop()
            logger.info("AIOKafkaConsumer stopped")

kafka_consumer = KafkaConsumerClient()
