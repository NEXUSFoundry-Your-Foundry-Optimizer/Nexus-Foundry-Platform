from fastapi import APIRouter
from backend.app.ml.xgboost_model import xgboost_model
from backend.app.ml.tft import tft_model
from backend.app.ml.pinn import pinn_model
from backend.app.digital_twins.melting import melting_twin

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("/xgboost")
async def get_xgboost_prediction(batch_id: str = "BATCH-20260301-0001"):
    """Expose the actual 65-feature prediction from the latest cascade.

    A bare melting-twin state is not a valid XGBoost feature vector.  Returning
    it here used to silently fill most model inputs with zeroes and also
    mutated the live melting state.  The cross-twin pipeline persists the real
    feature vector on the Pouring Twin, which is the only valid live source.
    """
    from backend.app.digital_twins.pouring import pouring_twin

    context = pouring_twin.get_state().get("workflow_context") or {}
    features = context.get("feature_vector") or {}
    if features and str(features.get("batch_id")) == str(batch_id):
        return xgboost_model.predict(features)
    return {
        "batch_id": batch_id,
        "defect_probability": None,
        "quality_prediction": "NOT_AVAILABLE",
        "risk_score": None,
        "quality_score": None,
        "model_source": "awaiting:cross_twin_65_feature_workflow",
        "reason": "No completed cross-twin feature vector exists for this batch yet.",
    }

@router.get("/tft")
async def get_tft_forecast(horizon: int = 12):
    state = melting_twin.get_state()
    # Once an anomaly has triggered, charts and clients must show the exact
    # emergency inference that generated the warning, rather than a later
    # inference that has no CSV history context.
    emergency = state.get("forecast")
    if isinstance(emergency, dict) and emergency.get("forecasts"):
        return {**emergency, "forecasts": emergency["forecasts"][:horizon]}
    return tft_model.forecast(
        current_temp=state.get("melt_temp", 1380.0),
        lining_health=state.get("lining_health", 0.85),
        horizon_hours=horizon
    )

@router.get("/pinn")
async def get_pinn_simulation():
    state = melting_twin.get_state()
    return pinn_model.simulate(state)
