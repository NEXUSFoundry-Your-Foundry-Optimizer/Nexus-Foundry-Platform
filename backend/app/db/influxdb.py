import logging
from typing import Dict, Any, List
from influxdb_client.client.influxdb_client_async import InfluxDBClientAsync
from influxdb_client import Point
from backend.app.config import settings

logger = logging.getLogger("InfluxDBClient")

class InfluxDBManager:
    def __init__(self):
        self.client: InfluxDBClientAsync = None
        self.connected = False

    async def connect(self):
        try:
            self.client = InfluxDBClientAsync(
                url=settings.INFLUXDB_URL,
                token=settings.INFLUXDB_TOKEN,
                org=settings.INFLUXDB_ORG
            )
            self.connected = True
            logger.info(f"Connected to InfluxDB at {settings.INFLUXDB_URL}")
        except Exception as e:
            logger.warning(f"InfluxDB connection failed ({e}). Operating in memory mode.")
            self.connected = False

    async def write_sensor_measurement(self, measurement: str, tags: Dict[str, str], fields: Dict[str, float]):
        if not self.connected or not self.client:
            return
            
        try:
            write_api = self.client.write_api()
            point = Point(measurement)
            for k, v in tags.items():
                point.tag(k, str(v))
            for k, v in fields.items():
                point.field(k, float(v))
                
            await write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        except Exception as e:
            logger.error(f"Error writing to InfluxDB: {e}")

    async def close(self):
        if self.client:
            await self.client.close()

influx_manager = InfluxDBManager()
