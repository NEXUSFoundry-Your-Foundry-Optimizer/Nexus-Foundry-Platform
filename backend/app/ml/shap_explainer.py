from typing import Dict, Any, Optional

import joblib
import pandas as pd

from backend.app.ml.xgboost_model import MODEL_DIR

class SHAPExplainer:
    """
    Provides SHAP feature attribution explanations for XGBoost predictions.
    """
    def __init__(self):
        self.explainer: Optional[Any] = None
        self.feature_names: list[str] = []
        self.load_error: Optional[str] = None
        try:
            self.explainer = joblib.load(MODEL_DIR / "shap_explainer.pkl")
            self.feature_names = list(joblib.load(MODEL_DIR / "xgboost_feature_names.pkl"))
        except Exception as exc:
            self.load_error = f"trained SHAP artifact unavailable: {exc}"

    def explain(self, prediction_id: str, features: Dict[str, Any]) -> Dict[str, Any]:
        if self.explainer is not None and self.feature_names:
            frame = pd.DataFrame(
                [{name: float(features.get(name, 0.0) or 0.0) for name in self.feature_names}],
                columns=self.feature_names,
            )
            values = self.explainer.shap_values(frame)[0]
            attributions = {name: round(float(value), 4) for name, value in zip(self.feature_names, values)}
            expected = self.explainer.expected_value
            base_value = float(expected[0] if hasattr(expected, "__len__") else expected)
            return {
                "prediction_id": prediction_id,
                "batch_id": features.get("batch_id", "BATCH-DEFAULT"),
                "base_value": base_value,
                "feature_attributions": attributions,
                "top_risk_driver": max(attributions, key=lambda key: abs(attributions[key])),
                "model_source": "trained:shap_explainer.pkl",
            }

        melt_temp = float(features.get("melt_temp", 1380.0))
        vibration = float(features.get("vibration_g", 0.03))
        sand_moisture = float(features.get("sand_moisture", 4.0))
        power_kw = float(features.get("power_kw", 800.0))
        
        attributions = {
            "melt_temp": round((melt_temp - 1380.0) * 0.005 + 0.12, 4),
            "vibration_g": round(vibration * 3.5, 4),
            "sand_moisture": round((sand_moisture - 4.0) * 0.08, 4),
            "power_kw": round((power_kw - 800.0) * 0.001, 4)
        }
        
        return {
            "prediction_id": prediction_id,
            "batch_id": features.get("batch_id", "BATCH-DEFAULT"),
            "base_value": 0.05,
            "feature_attributions": attributions,
            "top_risk_driver": max(attributions, key=attributions.get),
            "model_source": "fallback:formula",
        }

shap_explainer = SHAPExplainer()
