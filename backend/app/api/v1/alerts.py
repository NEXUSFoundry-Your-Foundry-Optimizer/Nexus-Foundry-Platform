from fastapi import APIRouter, Query
from typing import List
from datetime import datetime
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.molding import molding_twin
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.digital_twins.quality import quality_twin
from backend.app.alerts import alert_store

router = APIRouter(prefix="/alerts", tags=["Alerts"])

MOCK_ALERTS = [
    {
        "id": "a1",
        "twin": "melting",
        "batch": "CB-001",
        "severity": "critical",
        "time": "14:48:02",
        "message": "LSTM-AE anomaly detected — reconstruction error 2.18× threshold (0.78)"
    },
    {
        "id": "a2",
        "twin": "pouring",
        "batch": "CB-001",
        "severity": "critical",
        "time": "14:48:04",
        "message": "Cross-stage warning received from Melting Twin — defect risk 91%"
    },
    {
        "id": "a3",
        "twin": "melting",
        "batch": "CB-001",
        "severity": "warning",
        "time": "14:15:00",
        "message": "Melt temperature rising above holding band (+21°C in 20 min)"
    },
    {
        "id": "a4",
        "twin": "molding",
        "batch": "CB-002",
        "severity": "warning",
        "time": "09:15:41",
        "message": "Sand moisture drifting high — 4.6% against 4.0% target"
    },
    {
        "id": "a5",
        "twin": "quality",
        "batch": "CB-000",
        "severity": "normal",
        "time": "07:02:11",
        "message": "Batch cleared inspection — no defects classified"
    }
]

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
    if states["pouring"].get("pre_pour_risk", 0) > 0.7:
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
    if states["pouring"].get("pre_pour_risk", 0) > 0.7:
        active.append({"id": "current-pouring-risk", "twin": "pouring", "batch": states["pouring"].get("batch_id"), "severity": "critical", "time": states["pouring"].get("updated_at"), "message": "Pre-pour defect risk is currently above the critical threshold."})
    return active

@router.post("/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    return {"status": "success", "alert_id": alert_id, "read_at": datetime.now().isoformat()}
