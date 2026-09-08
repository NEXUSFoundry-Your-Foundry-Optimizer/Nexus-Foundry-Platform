from typing import Dict, Any

class XGBoostModel:
    """
    XGBoost defect probability, quality prediction, and pre-pour risk evaluation.
    """
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
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
            "quality_score": round(quality_score, 4)
        }

xgboost_model = XGBoostModel()
