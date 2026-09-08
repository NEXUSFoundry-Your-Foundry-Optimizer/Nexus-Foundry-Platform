from fastapi import APIRouter
from backend.app.ml.shap_explainer import shap_explainer
from backend.app.digital_twins.melting import melting_twin

router = APIRouter(prefix="/explanations", tags=["Explanations"])

@router.get("/{prediction_id}")
async def get_shap_explanation(prediction_id: str):
    state = melting_twin.get_state()
    return shap_explainer.explain(prediction_id, state)
