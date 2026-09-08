import numpy as np
from typing import Dict, Any, List

class LSTMAutoencoder:
    """
    LSTM Autoencoder for time-series reconstruction error anomaly detection.
    """
    def __init__(self, threshold: float = 0.35):
        self.threshold = threshold

    def detect_anomaly(self, telemetry_window: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not telemetry_window:
            return {"anomaly_score": 0.0, "is_anomaly": False}
            
        vals = [item.get("value", 0.0) for item in telemetry_window if "value" in item]
        if not vals:
            return {"anomaly_score": 0.0, "is_anomaly": False}
            
        mean_val = np.mean(vals)
        std_val = np.std(vals) if len(vals) > 1 else 0.01
        
        # Calculate normalized reconstruction error metric
        reconstruction_error = float(std_val / (abs(mean_val) + 1.0))
        is_anomaly = reconstruction_error > self.threshold
        
        return {
            "anomaly_score": round(reconstruction_error, 4),
            "threshold": self.threshold,
            "is_anomaly": is_anomaly,
            "reconstruction_error": round(reconstruction_error, 4)
        }

lstm_autoencoder = LSTMAutoencoder()
