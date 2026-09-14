from fastapi import APIRouter
from backend.app.digital_twins.melting import melting_twin

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

@router.get("/latest")
async def get_latest_anomaly():
    """Return the detector result produced for the current CSV replay row.

    This endpoint must not invoke the detector again with a synthetic one-value
    window: the live state already contains the exact 30-row LSTM-AE result
    used to decide whether the emergency workflow should start.
    """
    state = melting_twin.get_state()
    return {
        "batch_id": state.get("batch_id"),
        "event_time": state.get("updated_at"),
        **(state.get("anomaly_detection") or {
            "anomaly_score": state.get("anomaly_score"),
            "is_anomaly": state.get("anomaly_flag", False),
        }),
    }
