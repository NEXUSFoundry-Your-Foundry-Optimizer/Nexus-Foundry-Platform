import os
import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "models" / "tft" / "tft_model.pt"

class PyTorchTFT(nn.Module):
    def __init__(self, input_dim=7, hidden_dim=64, horizon=48):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.attention = nn.Linear(hidden_dim, input_dim)
        self.fc = nn.Linear(hidden_dim, horizon * 3)

    def forward(self, x):
        out, (hn, cn) = self.lstm(x)
        weights = torch.softmax(self.attention(out[:, -1, :]), dim=-1)
        quantiles = self.fc(hn[-1])
        return quantiles, weights

class TemporalFusionTransformer:
    """
    Temporal Fusion Transformer for multi-horizon forecasting of furnace temperature & lining health.
    Loads trained PyTorch weights from models/tft/tft_model.pt.
    """
    def __init__(self):
        self.model = None
        self._load_model()

    @property
    def loaded(self) -> bool:
        return self.model is not None

    def _load_model(self):
        try:
            if MODEL_PATH.exists():
                self.model = PyTorchTFT()
                self.model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
                self.model.eval()
        except Exception:
            self.model = None

    def forecast(
        self,
        current_temp: float,
        lining_health: float,
        horizon_hours: int = 48,
        forecast_at: Optional[str] = None,
        history: Optional[List[Dict[str, float]]] = None
    ) -> Dict[str, Any]:
        if self.model is None:
            return {
                "model": "TFT",
                "status": "unavailable",
                "horizon_hours": horizon_hours,
                "forecasts": [],
                "failure_time": None,
                "attention_weights": {},
                "forecast_9pm_temperature": None,
                "model_source": "unavailable:models/tft/tft_model.pt",
            }

        now = datetime.fromisoformat(forecast_at) if forecast_at else datetime.now()
        source_history = history or []
        rows = source_history[-30:] or [{"melt_temp": current_temp, "lining_health": lining_health}]
        if len(rows) < 30:
            rows = [rows[0]] * (30 - len(rows)) + rows

        def operating_state_code(value: Any) -> float:
            return {"Idle": 0.0, "Heating": 1.0, "Melting": 2.0, "Holding": 3.0, "Pouring": 4.0, "Maintenance": 5.0}.get(str(value), 2.0)

        def feature_row(row: Dict[str, Any]) -> list[float]:
            return [
                float(row.get("melt_temp", current_temp)),
                float(row.get("power_kw", 0.0)),
                float(row.get("vibration_g", 0.0)),
                float(row.get("lining_health_index", row.get("lining_health", lining_health))),
                float(row.get("cooling_water_inlet_temp", 0.0)),
                float(row.get("cooling_water_outlet_temp", 0.0)),
                operating_state_code(row.get("operating_state")),
            ]

        raw_window = np.asarray([feature_row(row) for row in rows], dtype=np.float32)
        # The model was trained around this physical furnace baseline.  These are
        # normalization constants, not generated sensor values.
        centers = np.array([1380.0, 800.0, 0.03, 0.625, 18.5, 32.0, 2.0], dtype=np.float32)
        scales = np.array([50.0, 100.0, 0.02, 0.20, 5.0, 10.0, 1.0], dtype=np.float32)
        x_input = torch.from_numpy(((raw_window - centers) / scales)[None, :, :])

        with torch.no_grad():
            quantile_tensor, weights_tensor = self.model(x_input)
        model_quantiles = quantile_tensor[0].detach().cpu().numpy().reshape(48, 3)
        weights = weights_tensor[0].detach().cpu().numpy()
        attention = {
            "melt_temp": round(float(weights[0]), 4),
            "power_kw": round(float(weights[1]), 4),
            "vibration_g": round(float(weights[2]), 4),
            "lining_health": round(float(weights[3]), 4),
            "cooling_water_inlet": round(float(weights[4]), 4),
            "cooling_water_outlet": round(float(weights[5]), 4),
            "operating_state": round(float(weights[6]), 4),
        }

        observed_temps = raw_window[:, 0]
        observed_lining = raw_window[:, 3]
        # Convert the model's predicted normalized residuals back to physical
        # units using volatility from the exact CSV context supplied to it.
        temp_scale = max(float(np.std(observed_temps)), 0.1)
        lining_scale = max(float(np.std(observed_lining)), 0.001)
        temp_residuals = model_quantiles[:, :3] * temp_scale
        lining_residuals = model_quantiles[:, :3] * lining_scale

        forecasts = []
        for hour in range(1, horizon_hours + 1):
            model_index = min(hour - 1, len(model_quantiles) - 1)
            temp_quantiles = np.sort(current_temp + temp_residuals[model_index])
            lining_quantiles = np.sort(np.clip(lining_health + lining_residuals[model_index], 0.0, 1.0))
            forecasts.append({
                "timestamp": (now + timedelta(hours=hour)).isoformat(),
                "forecast_temp": round(float(temp_quantiles[1]), 2),
                "predicted_lining_health": round(float(lining_quantiles[1]), 4),
                "p10": round(float(lining_quantiles[0]), 4),
                "p50": round(float(lining_quantiles[1]), 4),
                "p90": round(float(lining_quantiles[2]), 4),
                "temperature_p10": round(float(temp_quantiles[0]), 2),
                "temperature_p50": round(float(temp_quantiles[1]), 2),
                "temperature_p90": round(float(temp_quantiles[2]), 2),
            })

        failure = next((item for item in forecasts if item["p50"] < 0.3), None)
        forecast_9pm = next(
            (item["forecast_temp"] for item in forecasts if datetime.fromisoformat(item["timestamp"]).hour == 21),
            forecasts[-1]["forecast_temp"],
        )
        return {
            "model": "TFT",
            "status": "completed",
            "horizon_hours": horizon_hours,
            "forecasts": forecasts,
            "failure_time": failure["timestamp"] if failure else None,
            "attention_weights": attention,
            "forecast_9pm_temperature": forecast_9pm,
            "model_source": "artifact:models/tft/tft_model.pt",
            "input_rows_used": len(rows),
        }

tft_model = TemporalFusionTransformer()
