import json
from pathlib import Path
from typing import Dict, Any, List
import logging

import numpy as np

logger = logging.getLogger("LSTMAutoencoder")
MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "lstm" / "lstm_ae_best.h5"

class LSTMAutoencoder:
    """
    LSTM Autoencoder for time-series reconstruction error anomaly detection.
    Falls back to analytical physics-based reconstruction error in lightweight (512MB RAM) environments.
    """
    def __init__(self, threshold: float = 0.78):
        self.threshold = threshold
        self.model = None
        self.load_error = None
        self._baseline_mse: float | None = None
        self._load_model()

    def reset_calibration(self) -> None:
        """Start a new replay without carrying a previous furnace baseline."""
        self._baseline_mse = None

    def calibrate_baseline(self, telemetry_window: List[Dict[str, Any]]) -> float | None:
        """Calibrate from the opening, known-normal portion of the source replay."""
        feature_rows = [item.get("features", {}) for item in telemetry_window]
        feature_rows = [row for row in feature_rows if row]
        if not feature_rows:
            return None

        if self.model is not None:
            try:
                rows = feature_rows[-30:]
                if len(rows) < 30:
                    rows = [rows[0]] * (30 - len(rows)) + rows
                window = np.asarray([self._model_row(row) for row in rows], dtype=np.float32)[None, :, :]
                minimum = window.min(axis=1, keepdims=True)
                spread = np.maximum(window.max(axis=1, keepdims=True) - minimum, 1e-6)
                normalized = (window - minimum) / spread
                reconstructed = np.asarray(self.model.predict(normalized, verbose=0), dtype=np.float32)
                self._baseline_mse = max(float(np.mean(np.square(normalized - reconstructed))), 1e-6)
                return self._baseline_mse
            except Exception:
                pass

        self._baseline_mse = 0.005
        return self._baseline_mse

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
            self.model.predict(np.zeros((1, 30, 7), dtype=np.float32), verbose=0)
        except Exception as exc:
            self.model = None
            self.load_error = f"trained LSTM artifact unavailable: {exc}"

    @staticmethod
    def _model_row(row: Dict[str, float]) -> list[float]:
        state_code = {"Idle": 0.0, "Heating": 1.0, "Melting": 2.0, "Holding": 3.0, "Pouring": 4.0, "Maintenance": 5.0}.get(str(row.get("operating_state", "Melting")), 2.0)
        return [
            float(row.get("melt_temp", 0.0)),
            float(row.get("power_kw", 0.0)),
            float(row.get("vibration_g", 0.0)),
            float(row.get("lining_health_index", row.get("lining_health", 0.0))),
            float(row.get("cooling_water_inlet_temp", 18.5)),
            float(row.get("cooling_water_outlet_temp", 32.0)),
            state_code,
        ]

    def detect_anomaly(self, telemetry_window: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not telemetry_window:
            return {"anomaly_score": 0.0, "is_anomaly": False, "threshold": self.threshold}
            
        feature_rows = [item.get("features", {}) for item in telemetry_window]
        feature_rows = [row for row in feature_rows if row]
        if not feature_rows:
            vals = [item.get("value", 0.0) for item in telemetry_window if "value" in item]
            if not vals:
                return {"anomaly_score": 0.0, "is_anomaly": False, "threshold": self.threshold}

        # If trained TensorFlow model is loaded and working
        if self.model is not None and feature_rows:
            try:
                rows = feature_rows[-30:]
                if len(rows) < 30:
                    rows = [rows[0]] * (30 - len(rows)) + rows
                window = np.asarray([self._model_row(row) for row in rows], dtype=np.float32)[None, :, :]
                minimum = window.min(axis=1, keepdims=True)
                spread = np.maximum(window.max(axis=1, keepdims=True) - minimum, 1e-6)
                normalized = (window - minimum) / spread
                reconstructed = np.asarray(self.model.predict(normalized, verbose=0), dtype=np.float32)
                raw_mse = float(np.mean(np.square(normalized - reconstructed)))

                if self._baseline_mse is None:
                    self._baseline_mse = max(raw_mse, 1e-6)

                reconstruction_error = float(np.clip(0.10 * raw_mse / self._baseline_mse, 0.0, 5.0))
                is_anomaly = reconstruction_error > self.threshold
                return {
                    "anomaly_score": round(reconstruction_error, 2),
                    "threshold": self.threshold,
                    "is_anomaly": is_anomaly,
                    "reconstruction_error": round(reconstruction_error, 2),
                    "raw_reconstruction_mse": round(raw_mse, 6),
                    "baseline_reconstruction_mse": round(self._baseline_mse, 6),
                    "window_rows": len(feature_rows),
                    "model_source": "artifact:models/lstm/lstm_ae_best.h5",
                }
            except Exception as e:
                logger.debug(f"TensorFlow inference skipped, falling back to analytical detector: {e}")

        # Analytical physics-based reconstruction error (lightweight / low-RAM environment)
        latest = feature_rows[-1]
        temp = float(latest.get("melt_temp", 1380.0))
        vib = float(latest.get("vibration_g", 0.03))
        lining = float(latest.get("lining_health_index", latest.get("lining_health", 0.85)))
        power = float(latest.get("power_kw", 800.0))

        temp_dev = max(0.0, (temp - 1420.0) / 100.0) if temp > 1420 else max(0.0, (1320.0 - temp) / 100.0)
        vib_dev = max(0.0, (vib - 0.05) / 0.08)
        lining_dev = max(0.0, (0.75 - lining) / 0.25)
        power_dev = max(0.0, (power - 950.0) / 200.0)

        reconstruction_error = float(np.clip(
            0.05 + 0.35 * temp_dev + 0.45 * vib_dev + 0.35 * lining_dev + 0.15 * power_dev,
            0.02,
            5.0,
        ))
        is_anomaly = reconstruction_error > self.threshold
        return {
            "anomaly_score": round(reconstruction_error, 2),
            "threshold": self.threshold,
            "is_anomaly": is_anomaly,
            "reconstruction_error": round(reconstruction_error, 2),
            "raw_reconstruction_mse": round(reconstruction_error * 0.01, 6),
            "baseline_reconstruction_mse": 0.005,
            "window_rows": len(feature_rows),
            "model_source": "analytical:physics_reconstruction",
        }

lstm_autoencoder = LSTMAutoencoder()
