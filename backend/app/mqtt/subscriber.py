import json
import logging
from typing import Any, Dict
import paho.mqtt.client as mqtt
from backend.app.config import settings

import uuid

logger = logging.getLogger("MQTTSubscriber")

class MQTTSubscriber:
    """
    Active MQTT subscriber for consuming physical sensor streams on foundry/+/+ topics.
    """
    def __init__(self):
        self.client = mqtt.Client(client_id=f"nexus-mqtt-subscriber-{uuid.uuid4().hex[:6]}")
        self.connected = False

    def connect(self):
        try:
            self.client.on_connect = self._on_connect
            self.client.on_message = self._on_message
            self.client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
            self.client.loop_start()
            self.connected = True
            logger.info(f"MQTTSubscriber connected to broker at {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
        except Exception as e:
            logger.warning(f"MQTT subscriber connection failed ({e}). Operating in simulation stream mode.")
            self.connected = False

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            client.subscribe("foundry/+/+")
            logger.debug("MQTTSubscriber subscribed to topic wildcard foundry/+/+")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            topic = msg.topic
            logger.debug(f"MQTT message on {topic}: {payload}")
        except Exception as e:
            logger.error(f"Error processing MQTT message on {msg.topic}: {e}")

    def disconnect(self):
        if self.connected:
            self.client.loop_stop()
            self.client.disconnect()
            self.connected = False

mqtt_subscriber = MQTTSubscriber()
