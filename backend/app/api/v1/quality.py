from fastapi import APIRouter
from backend.app.digital_twins.quality import quality_twin

router = APIRouter(prefix="/quality", tags=["Quality"])

@router.get("/latest")
async def get_latest_quality():
    return quality_twin.get_state()
