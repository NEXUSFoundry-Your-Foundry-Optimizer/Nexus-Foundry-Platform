import json
from pathlib import Path
from typing import Dict, Any, List

import numpy as np

MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "lstm" / "lstm_ae_best.h5"

class LSTMAutoencoder:
    """
    LSTM Autoencoder for time-series reconstruction error anomaly detection.
    """
    def __init__(self, threshold: float = 0.78):
        self.threshold = threshold
        self.model = None
        self.load_error = None
        self._load_model()

    def _load_model(self) -> None:
        try:
            import h5py
            import tensorflow as tf

            with h5py.File(MODEL_PATH, "r") as handle:
                raw_config = handle.attrs["model_config"]
            config = json.loads(raw_config.decode() if isinstance(raw_config, bytes) else raw_config)

            def remove_unsupported(value: Any) -> Any:
                if isinstance(value, dict):
                    return {key: remove_unsupported(item) for key, item in value.items() if key != "quantization_config"}
                if isinstance(value, list):
                    return [remove_unsupported(item) for item in value]
                return value

            self.model = tf.keras.models.model_from_json(
                json.dumps(remove_unsupported(config)),
                custom_objects={"Functional": tf.keras.Model},
            )
            self.model.load_weights(MODEL_PATH)
        except Exception as exc:
            self.model = None
            self.load_error = f"trained LSTM artifact unavailable: {exc}"

    @staticmethod
    def _model_row(row: Dict[str, float]) -> list[float]:
        state_code = {"Idle": 0.0, "Heating": 1.0, "Melting": 2.0, "Holding": 3.0, "Pouring": 4.0, "Maintenance": 5.0}.get(str(row.get("operating_state", "Idle")), 0.0)
        return [
            float(row.get("melt_temp", 0.0)),
            float(row.get("power_kw", 0.0)),
            float(row.get("vibration_g", 0.0)),
            float(row.get("lining_health_index", 0.0)),
            float(row.get("cooling_water_inlet_temp", 0.0)),
            float(row.get("cooling_water_outlet_temp", 0.0)),
            state_code,
        ]

    def detect_anomaly(self, telemetry_window: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not telemetry_window:
            return {"anomaly_score": 0.0, "is_anomaly": False}
            
        feature_rows = [item.get("features", {}) for item in telemetry_window]
        feature_rows = [row for row in feature_rows if row]
        if not feature_rows:
            vals = [item.get("value", 0.0) for item in telemetry_window if "value" in item]
            if not vals:
                return {"anomaly_score": 0.0, "is_anomaly": False, "threshold": self.threshold}
            feature_rows = [{"value": value} for value in vals]

        if self.model is not None and len(feature_rows) >= 30:
            window = np.asarray([self._model_row(row) for row in feature_rows[-30:]], dtype=np.float32)[None, :, :]
            minimum = window.min(axis=1, keepdims=True)
            spread = np.maximum(window.max(axis=1, keepdims=True) - minimum, 1e-6)
            original = (window - minimum) / spread
            reconstructed = np.asarray(self.model.predict(original, verbose=0), dtype=np.float32)
            reconstruction_error = float(np.mean(np.square(original - reconstructed)))
            is_anomaly = reconstruction_error > self.threshold
            return {
                "anomaly_score": round(reconstruction_error, 4),
                "threshold": self.threshold,
                "is_anomaly": is_anomaly,
                "reconstruction_error": round(reconstruction_error, 4),
                "model_source": "trained:lstm_ae_best.h5",
            }

        feature_names = tuple(feature_rows[-1].keys())
        if len(feature_rows) < 2:
            return {"anomaly_score": 0.0, "is_anomaly": False}

        reference = feature_rows[:-1]
        current = feature_rows[-1]
        errors = []
        for name in feature_names:
            values = np.asarray([float(row.get(name, 0.0)) for row in reference], dtype=float)
            scale = float(np.std(values)) or 1.0
            errors.append(abs(float(current.get(name, 0.0)) - float(np.mean(values))) / scale)

        reconstruction_error = float(np.mean(errors) / 10.0)
        is_anomaly = reconstruction_error > self.threshold
        
        return {
            "anomaly_score": round(reconstruction_error, 4),
            "threshold": self.threshold,
            "is_anomaly": is_anomaly,
            "reconstruction_error": round(reconstruction_error, 4)
            ,"model_source": "fallback:statistical"
        }

lstm_autoencoder = LSTMAutoencoder()
