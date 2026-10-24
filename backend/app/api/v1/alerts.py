from fastapi import APIRouter, Query
from typing import List, Optional
from datetime import datetime
from backend.app.alerts import alert_store

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
async def get_alerts(twin: str | None = Query(None)):
    alerts = alert_store.list(twin)
    return alerts

@router.get("/active")
async def get_active_alerts():
    # Return all historical and active alerts so that once an alert appears, it is retained
    return alert_store.list()

@router.post("/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    return {"status": "success", "alert_id": alert_id, "read_at": datetime.now().isoformat()}
