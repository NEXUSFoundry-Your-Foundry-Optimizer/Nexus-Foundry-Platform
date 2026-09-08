from fastapi import APIRouter
from backend.app.ml.xgboost_model import xgboost_model
from backend.app.digital_twins.melting import melting_twin

router = APIRouter(prefix="/risk", tags=["Risk"])

@router.get("/latest")
async def get_latest_risk():
    state = melting_twin.get_state()
    return xgboost_model.predict(state)
