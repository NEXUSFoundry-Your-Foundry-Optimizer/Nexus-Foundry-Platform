from fastapi import APIRouter
from backend.app.ml.lstm_autoencoder import lstm_autoencoder
from backend.app.digital_twins.melting import melting_twin

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

@router.get("/latest")
async def get_latest_anomaly():
    state = melting_twin.get_state()
    res = lstm_autoencoder.detect_anomaly([{"value": state.get("vibration_g", 0.03)}])
    res["batch_id"] = state.get("batch_id")
    return res
