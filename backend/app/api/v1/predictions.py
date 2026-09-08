from fastapi import APIRouter
from backend.app.ml.xgboost_model import xgboost_model
from backend.app.ml.tft import tft_model
from backend.app.ml.pinn import pinn_model
from backend.app.digital_twins.melting import melting_twin

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("/xgboost")
async def get_xgboost_prediction(batch_id: str = "BATCH-20260301-0001"):
    state = melting_twin.get_state()
    state["batch_id"] = batch_id
    return xgboost_model.predict(state)

@router.get("/tft")
async def get_tft_forecast(horizon: int = 12):
    state = melting_twin.get_state()
    return tft_model.forecast(
        current_temp=state.get("melt_temp", 1380.0),
        lining_health=state.get("lining_health", 0.85),
        horizon_hours=horizon
    )

@router.get("/pinn")
async def get_pinn_simulation():
    state = melting_twin.get_state()
    return pinn_model.simulate(state)
