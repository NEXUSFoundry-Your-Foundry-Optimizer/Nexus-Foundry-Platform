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
            magnitude_total = sum(abs(value) for value in attributions.values()) or 1.0
            groups = {
                "temperature": ("melt_temp", "pour_temp"),
                "lining": ("lining_health",),
                "geometry": tuple(name for name in self.feature_names if name.startswith("shape_")),
                "molding": ("sand_moisture", "permeability", "compactness"),
                "pouring": ("pour_speed", "pour_duration_sec", "ladle_fill"),
            }
            contribution_groups = {
                label: round(sum(abs(attributions.get(name, 0.0)) for name in names) / magnitude_total * 100, 2)
                for label, names in groups.items()
            }
            expected = self.explainer.expected_value
            base_value = float(expected[0] if hasattr(expected, "__len__") else expected)
            return {
                "prediction_id": prediction_id,
                "batch_id": features.get("batch_id", "BATCH-DEFAULT"),
                "base_value": base_value,
                "feature_attributions": attributions,
                "contribution_groups": contribution_groups,
                "top_risk_driver": max(attributions, key=lambda key: abs(attributions[key])),
                "model_source": "artifact:models/xgboost/shap_explainer.pkl",
            }

        return {
            "prediction_id": prediction_id,
            "batch_id": features.get("batch_id", "BATCH-DEFAULT"),
            "base_value": None,
            "feature_attributions": {},
            "top_risk_driver": None,
            "model_source": "unavailable:trained_shap_artifact",
            "error": self.load_error,
        }

shap_explainer = SHAPExplainer()
