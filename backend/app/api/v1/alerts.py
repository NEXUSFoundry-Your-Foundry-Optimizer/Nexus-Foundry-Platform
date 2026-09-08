from fastapi import APIRouter
from typing import List
from datetime import datetime

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
async def get_alerts():
    return MOCK_ALERTS

@router.post("/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    return {"status": "success", "alert_id": alert_id, "read_at": datetime.now().isoformat()}
