from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime, timedelta
import math

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("/series/{twin_id}")
async def get_sensor_series(twin_id: str, points: int = 40):
    baseline = {
        "melting": [1479.0, 1023.0, 620.0],
        "molding": [420.0, 118.0, 96.0],
        "pouring": [1391.0, 91.0, 74.0],
        "quality": [29.0, 94.0, 61.0]
    }.get(twin_id, [100.0, 50.0, 10.0])
    
    a, b, c = baseline
    now = datetime.now()
    series = []
    
    for i in range(points):
        d = now - timedelta(seconds=(points - i) * 2)
        temp = round(a + math.sin(i / 3.0) * (a * 0.012), 2)
        power = round(b + math.sin(i / 3.0 + 1.4) * (b * 0.03), 2)
        vib = round(c + math.sin(i / 3.0 + 2.7) * (c * 0.06), 2)
        
        series.append({
            "t": d.strftime("%H:%M:%S"),
            "temp": temp,
            "power": power,
            "vibration": vib
        })
        
    return {"twin_id": twin_id, "series": series}
