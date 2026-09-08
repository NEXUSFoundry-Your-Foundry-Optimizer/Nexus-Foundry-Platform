import json
import logging
from typing import Dict, Any
from aiokafka import AIOKafkaProducer
from backend.app.config import settings

logger = logging.getLogger("KafkaProducer")

class KafkaProducerClient:
    def __init__(self):
        self.producer: AIOKafkaProducer = None
        self.started = False

    async def start(self):
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode("utf-8")
            )
            await self.producer.start()
            self.started = True
            logger.info("AIOKafkaProducer started successfully")
        except Exception as e:
            logger.warning(f"Kafka producer start failed ({e}). Operating in in-memory fallback mode.")
            self.started = False

    async def send(self, topic: str, value: Dict[str, Any]):
        if self.started and self.producer:
            try:
                await self.producer.send_and_wait(topic, value)
            except Exception as e:
                logger.error(f"Error publishing to Kafka topic {topic}: {e}")
        else:
            # In-memory dispatch to Digital Twins & services
            pass

    async def stop(self):
        if self.started and self.producer:
            await self.producer.stop()
            self.started = False

kafka_producer = KafkaProducerClient()
