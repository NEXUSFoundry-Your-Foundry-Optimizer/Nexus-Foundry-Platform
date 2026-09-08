import json
import logging
from typing import Any, Dict
import paho.mqtt.client as mqtt
from backend.app.config import settings

logger = logging.getLogger("MQTTPublisher")

class MQTTPublisher:
    def __init__(self):
        self.client = mqtt.Client(client_id=settings.MQTT_CLIENT_ID)
        self.connected = False

    def connect(self):
        try:
            self.client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
            self.client.loop_start()
            self.connected = True
            logger.info(f"Connected to Mosquitto MQTT broker at {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
        except Exception as e:
            logger.warning(f"MQTT connection failed ({e}). Operating in fallback mode.")
            self.connected = False

    async def publish(self, topic: str, payload: Dict[str, Any]):
        json_payload = json.dumps(payload)
        if self.connected:
            try:
                self.client.publish(topic, json_payload)
            except Exception as e:
                logger.error(f"MQTT publish error on {topic}: {e}")
        else:
            # Fallback direct loop if MQTT broker is offline
            pass

    def disconnect(self):
        if self.connected:
            self.client.loop_stop()
            self.client.disconnect()
            self.connected = False

mqtt_publisher = MQTTPublisher()
