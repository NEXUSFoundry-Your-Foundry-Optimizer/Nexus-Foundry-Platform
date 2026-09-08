import logging
from backend.app.kafka.producer import kafka_producer
from backend.app.kafka.topics import KafkaTopics

logger = logging.getLogger("MQTTKafkaBridge")

class MQTTKafkaBridge:
    @staticmethod
    async def bridge_mqtt_to_kafka(topic: str, payload: dict):
        """
        Receives MQTT events from Mosquitto broker and routes them into Kafka event streams.
        """
        if topic.startswith("foundry/sensors/"):
            await kafka_producer.send(KafkaTopics.SENSOR_EVENTS, payload)
        elif topic == "foundry/inspections":
            await kafka_producer.send(KafkaTopics.INSPECTION_EVENTS, payload)
        else:
            await kafka_producer.send(KafkaTopics.SENSOR_EVENTS, payload)

mqtt_kafka_bridge = MQTTKafkaBridge()
