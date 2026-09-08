from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime
from backend.app.websocket.manager import ws_manager

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("/series/{twin_id}")
async def get_sensor_series(twin_id: str, points: int = 40):
    history = ws_manager.get_twin_history(twin_id)[-max(1, min(points, 60)):]
    return {"twin_id": twin_id, "series": history}
