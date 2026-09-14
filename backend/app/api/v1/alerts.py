from fastapi import APIRouter, Query
from typing import List
from datetime import datetime
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.molding import molding_twin
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.digital_twins.quality import quality_twin
from backend.app.alerts import alert_store

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
async def get_alerts(twin: str | None = Query(None)):
    states = {
        "melting": melting_twin.get_state(),
        "molding": molding_twin.get_state(),
        "pouring": pouring_twin.get_state(),
        "quality": quality_twin.get_state(),
    }
    alerts = alert_store.list(twin)
    now = datetime.now().isoformat()
    current_alerts = []
    if states["melting"].get("anomaly_flag") and states["melting"].get("updated_at"):
        current_alerts.append({"id": "current-melting-anomaly", "twin": "melting", "batch": states["melting"].get("batch_id"), "severity": "critical", "time": states["melting"]["updated_at"], "message": "Anomaly score exceeded the configured threshold."})
    if float(states["pouring"].get("pre_pour_risk") or 0.0) > 0.7:
        current_alerts.append({"id": "current-pouring-risk", "twin": "pouring", "batch": states["pouring"].get("batch_id"), "severity": "critical", "time": now, "message": "Pre-pour defect risk is above the critical threshold."})
    combined = {alert["id"]: alert for alert in [*current_alerts, *alerts]}
    return [alert for alert in combined.values() if twin is None or alert["twin"] == twin]

@router.get("/active")
async def get_active_alerts():
    states = {
        "melting": melting_twin.get_state(),
        "pouring": pouring_twin.get_state(),
    }
    active = []
    if states["melting"].get("anomaly_flag"):
        active.append({"id": "current-melting-anomaly", "twin": "melting", "batch": states["melting"].get("batch_id"), "severity": "critical", "time": states["melting"].get("updated_at"), "message": "Anomaly score is currently above the configured threshold."})
    if float(states["pouring"].get("pre_pour_risk") or 0.0) > 0.7:
        active.append({"id": "current-pouring-risk", "twin": "pouring", "batch": states["pouring"].get("batch_id"), "severity": "critical", "time": states["pouring"].get("updated_at"), "message": "Pre-pour defect risk is currently above the critical threshold."})
    return active

@router.post("/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    return {"status": "success", "alert_id": alert_id, "read_at": datetime.now().isoformat()}
