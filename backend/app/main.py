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

from backend.app.api.v1.simulation import router as simulation_router, WhatIfRequest, what_if
from backend.app.api.v1.datasets import router as datasets_router
from backend.app.api.v1.digital_twins import router as digital_twins_router
from backend.app.api.v1.predictions import router as predictions_router
from backend.app.api.v1.explanations import router as explanations_router
from backend.app.api.v1.chat import router as chat_router, ChatRequest, chat_with_rag_agent
from backend.app.api.v1.alerts import router as alerts_router
from backend.app.api.v1.sensors import router as sensors_router
from backend.app.api.v1.anomalies import router as anomalies_router
from backend.app.api.v1.quality import router as quality_router, InspectionRequest, inspect_quality
from backend.app.api.v1.risk import router as risk_router
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.molding import molding_twin
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.digital_twins.quality import quality_twin
from backend.app.simulator.dataset_loader import dataset_loader
from backend.app.simulator.simulator_state import global_simulator_state
from backend.app.simulator.replay_controller import replay_controller
from backend.app.ml.shap_explainer import shap_explainer
from backend.app.ml.xgboost_model import xgboost_model
from backend.app.ml.lstm_autoencoder import lstm_autoencoder

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
    if not global_simulator_state.is_running:
        await replay_controller.start(dataset_name="furnace_sensor.csv", speed=1.0)

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

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "nexus-foundry", "simulation": "available"}

@app.get("/api/models/status")
async def model_status():
    return {
        "xgboost": {"loaded": xgboost_model.model is not None, "error": xgboost_model.load_error},
        "shap": {"loaded": shap_explainer.explainer is not None, "error": shap_explainer.load_error},
        "lstm_autoencoder": {"loaded": lstm_autoencoder.model is not None, "error": lstm_autoencoder.load_error},
        "tft": {"loaded": False, "error": "TFT weights were not uploaded; only tft_scaler.pkl is present"},
        "pinn": {"loaded": False, "error": "A loadable .pth checkpoint and model class are not present; pinn_model_best is a checkpoint directory"},
    }

@app.get("/api/dashboard/summary")
async def dashboard_summary():
    states = {
        "melting": melting_twin.get_state(),
        "molding": molding_twin.get_state(),
        "pouring": pouring_twin.get_state(),
        "quality": quality_twin.get_state(),
    }
    return {"updated_at": max(state["updated_at"] for state in states.values()), "twins": states}

@app.get("/api/simulation/diagnostics")
async def simulation_diagnostics():
    return {
        "status": global_simulator_state.dict(),
        "history_points": {twin: len(ws_manager.get_twin_history(twin)) for twin in ("melting", "molding", "pouring", "quality")},
    }

@app.get("/api/twin/{twin}/state")
async def contract_twin_state(twin: str):
    states = {"melting": melting_twin, "molding": molding_twin, "pouring": pouring_twin, "quality": quality_twin}
    if twin not in states:
        return {"detail": "Unknown digital twin"}
    return states[twin].get_state()

@app.get("/api/batches")
async def batches():
    rows = dataset_loader.load_csv("production_master.csv").tail(50)
    return [{
        "id": str(row.get("batch_id")),
        "start": str(row.get("pour_time", row.get("production_date"))),
        "status": "normal",
        "predicted": None,
        "actual": "Pending",
        "alloy": str(row.get("alloy_grade", "unknown")),
    } for row in rows.to_dict(orient="records")]

@app.get("/api/analytics/shap")
async def analytics_shap():
    explanation = shap_explainer.explain("live", {**melting_twin.get_state(), **molding_twin.get_state()})
    return {
        "prediction": "Defect risk",
        "probability": float(pouring_twin.get_state().get("pre_pour_risk", 0.0)),
        "recommendation": f"Monitor {explanation['top_risk_driver']} before the next pour.",
        "features": [{"name": key, "value": value} for key, value in explanation["feature_attributions"].items()],
    }

@app.post("/api/simulate/what-if")
async def contract_what_if(request: WhatIfRequest):
    return await what_if(request)

@app.post("/api/rag/ask")
async def contract_rag(request: ChatRequest):
    return await chat_with_rag_agent(request)

@app.post("/api/quality/inspect")
async def contract_inspect(request: InspectionRequest):
    return await inspect_quality(request)

@app.post("/api/anomaly/detect")
async def contract_anomaly():
    state = melting_twin.get_state()
    return {"batch_id": state.get("batch_id"), "anomaly_score": state.get("anomaly_score", 0.0), "is_anomaly": state.get("anomaly_flag", False), "threshold": lstm_autoencoder.threshold}

@app.post("/api/defect/predict")
async def contract_defect_predict():
    return xgboost_model.predict({**melting_twin.get_state(), **molding_twin.get_state(), **pouring_twin.get_state()})

# WebSockets Endpoint for Real-Time Three.js & Digital Twin updates
@app.websocket("/ws")
@app.websocket("/api/v1/ws")
@app.websocket("/api/v1/ws/digital-twin/{batch_id}")
async def websocket_digital_twin_endpoint(websocket: WebSocket, batch_id: str = "all"):
    await ws_manager.connect(websocket, batch_id=batch_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat or client commands
            await websocket.send_text(f'{{"type": "ack", "message": "connected", "batch_id": "{batch_id}"}}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, batch_id=batch_id)
