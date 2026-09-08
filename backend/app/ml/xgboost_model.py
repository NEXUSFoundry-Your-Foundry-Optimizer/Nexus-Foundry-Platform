from pathlib import Path
from typing import Dict, Any, Optional

import joblib
import pandas as pd
import xgboost as xgb

MODEL_DIR = Path(__file__).resolve().parents[2] / "models" / "xgboost"

class XGBoostModel:
    """
    XGBoost defect probability, quality prediction, and pre-pour risk evaluation.
    """
    def __init__(self):
        self.model: Optional[xgb.Booster] = None
        self.scaler = None
        self.feature_names: list[str] = []
        self.load_error: Optional[str] = None
        try:
            self.model = xgb.Booster()
            self.model.load_model(str(MODEL_DIR / "xgboost_model.json"))
            self.scaler = joblib.load(MODEL_DIR / "xgboost_scaler.pkl")
            self.feature_names = list(joblib.load(MODEL_DIR / "xgboost_feature_names.pkl"))
        except Exception as exc:
            self.model = None
            self.load_error = f"trained XGBoost artifacts unavailable: {exc}"

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is not None and self.feature_names:
            frame = pd.DataFrame(
                [{name: float(features.get(name, 0.0) or 0.0) for name in self.feature_names}],
                columns=self.feature_names,
            )
            scaled = self.scaler.transform(frame) if self.scaler is not None else frame.to_numpy()
            probability = float(self.model.predict(xgb.DMatrix(scaled, feature_names=self.feature_names))[0])
            probability = min(0.999, max(0.001, probability))
            return {
                "batch_id": features.get("batch_id", "BATCH-DEFAULT"),
                "defect_probability": round(probability, 4),
                "quality_prediction": "PASS" if probability < 0.25 else "HIGH_RISK",
                "risk_score": round(probability, 4),
                "quality_score": round(1.0 - probability, 4),
                "model_source": "trained:xgboost_model.json",
            }

        melt_temp = float(features.get("melt_temp", 1380.0))
        power_kw = float(features.get("power_kw", 800.0))
        sand_moisture = float(features.get("sand_moisture", 4.0))
        vibration = float(features.get("vibration_g", 0.03))
        
        # Calculate risk score based on parameter deviations
        temp_dev = abs(melt_temp - 1400.0) / 100.0
        sand_dev = abs(sand_moisture - 4.2) / 2.0
        vib_dev = vibration * 10.0
        
        raw_risk = (temp_dev * 0.4) + (sand_dev * 0.3) + (vib_dev * 0.3)
        defect_prob = min(0.99, max(0.01, float(raw_risk)))
        quality_score = 1.0 - defect_prob
        
        return {
            "batch_id": features.get("batch_id", "BATCH-DEFAULT"),
            "defect_probability": round(defect_prob, 4),
            "quality_prediction": "PASS" if defect_prob < 0.25 else "HIGH_RISK",
            "risk_score": round(defect_prob, 4),
            "quality_score": round(quality_score, 4),
            "model_source": "fallback:formula",
        }

xgboost_model = XGBoostModel()
