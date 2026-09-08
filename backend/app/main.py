from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging

from backend.app.config import settings
from backend.app.mqtt.publisher import mqtt_publisher
from backend.app.kafka.producer import kafka_producer
from backend.app.db.postgres import init_postgres
from backend.app.db.influxdb import influx_manager
from backend.app.db.redis import redis_manager
from backend.app.websocket.manager import ws_manager

from backend.app.api.v1.simulation import router as simulation_router
from backend.app.api.v1.datasets import router as datasets_router
from backend.app.api.v1.digital_twins import router as digital_twins_router
from backend.app.api.v1.predictions import router as predictions_router
from backend.app.api.v1.explanations import router as explanations_router
from backend.app.api.v1.chat import router as chat_router
from backend.app.api.v1.alerts import router as alerts_router
from backend.app.api.v1.sensors import router as sensors_router
from backend.app.api.v1.anomalies import router as anomalies_router
from backend.app.api.v1.quality import router as quality_router
from backend.app.api.v1.risk import router as risk_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NEXUSMain")

app = FastAPI(
    title="NEXUS-Foundry Production Backend Gateway",
    version="1.0.0",
    description="Event-Driven Microservices Backend for Physical Dataset Simulation & Digital Twins"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers
app.include_router(simulation_router, prefix="/api/v1")
app.include_router(datasets_router, prefix="/api/v1")
app.include_router(digital_twins_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(explanations_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(sensors_router, prefix="/api/v1")
app.include_router(anomalies_router, prefix="/api/v1")
app.include_router(quality_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing NEXUS-Foundry microservices stack...")
    mqtt_publisher.connect()
    await kafka_producer.start()
    await init_postgres()
    await influx_manager.connect()
    await redis_manager.connect()

@app.on_event("shutdown")
async def shutdown_event():
    mqtt_publisher.disconnect()
    await kafka_producer.stop()
    await influx_manager.close()

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "NEXUS-Foundry Production Gateway",
        "docs": "/docs"
    }

# WebSockets Endpoint for Real-Time Three.js Digital Twin updates
@app.websocket("/api/v1/ws/digital-twin/{batch_id}")
async def websocket_digital_twin_endpoint(websocket: WebSocket, batch_id: str):
    await ws_manager.connect(websocket, batch_id=batch_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat or client commands
            await websocket.send_text(f'{{"type": "ack", "message": "connected", "batch_id": "{batch_id}"}}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, batch_id=batch_id)
