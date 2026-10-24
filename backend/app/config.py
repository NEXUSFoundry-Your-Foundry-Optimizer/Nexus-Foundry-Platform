import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", 8000))
    SECRET_KEY: str = "nexus-foundry-super-secret-key-2026"
    
    # MQTT
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", 1883))
    MQTT_CLIENT_ID: str = "nexus-simulator"
    
    # Kafka — use 29092 when running outside Docker (PLAINTEXT_HOST listener)
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
    
    # Postgres
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "nexus")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "nexuspass")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "nexus_foundry")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", 5432))
    
    # InfluxDB
    INFLUXDB_URL: str = os.getenv("INFLUXDB_URL", "http://localhost:8086")
    INFLUXDB_TOKEN: str = os.getenv("INFLUXDB_TOKEN", "nexus-influx-super-token-2026")
    INFLUXDB_ORG: str = os.getenv("INFLUXDB_ORG", "nexus_org")
    INFLUXDB_BUCKET: str = os.getenv("INFLUXDB_BUCKET", "sensor_data")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    
    # OpenTelemetry
    OTEL_EXPORTER_OTLP_ENDPOINT: str = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318")
    
    # Dataset Directory
    DATASETS_DIR: str = os.getenv("DATASETS_DIR", "./Datasets")

    class Config:
        env_file = ".env"

settings = Settings()
