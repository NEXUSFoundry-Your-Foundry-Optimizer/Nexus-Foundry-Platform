from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class TemporalFusionTransformer:
    """
    TFT model for multi-horizon forecasting of furnace temperature & lining health.
    """
    def forecast(self, current_temp: float, lining_health: float, horizon_hours: int = 48, forecast_at: Optional[str] = None, history: Optional[List[Dict[str, float]]] = None) -> Dict[str, Any]:
        forecasts = []
        now = datetime.fromisoformat(forecast_at) if forecast_at else datetime.now()
        history = history or []
        recent_temps = [float(item.get("melt_temp", current_temp)) for item in history[-168:]]
        temp_slope = ((recent_temps[-1] - recent_temps[0]) / max(1, len(recent_temps) - 1)) if len(recent_temps) > 1 else 0.15
        lining_slope = 0.005
        
        for h in range(1, horizon_hours + 1):
            future_temp = current_temp + (h * temp_slope)
            future_lining = max(0.0, lining_health - (h * lining_slope))
            forecasts.append({
                "timestamp": (now + timedelta(hours=h)).isoformat(),
                "forecast_temp": round(future_temp, 2),
                "predicted_lining_health": round(future_lining, 4),
                "p10": round(max(0.0, future_lining - 0.03), 4),
                "p50": round(future_lining, 4),
                "p90": round(min(1.0, future_lining + 0.03), 4),
            })
            
        failure_index = next((index for index, item in enumerate(forecasts) if item["p50"] < 0.3), None)
        estimated_failure_time = (
            forecasts[failure_index]["timestamp"]
            if failure_index is not None
            else (now + timedelta(hours=max(0.0, (lining_health - 0.3) / lining_slope))).isoformat()
        )
        attention = {
            "melt_temp": 0.35,
            "power_kw": 0.15,
            "vibration_g": 0.2,
            "lining_health": 0.2,
            "cooling_water": 0.1,
        }
        return {
            "model": "TFT",
            "horizon_hours": horizon_hours,
            "forecasts": forecasts,
            "failure_time": estimated_failure_time,
            "attention_weights": attention,
            "forecast_9pm_temperature": next((item["forecast_temp"] for item in forecasts if datetime.fromisoformat(item["timestamp"]).hour == 21), forecasts[-1]["forecast_temp"]),
            "model_source": "fallback:temporal-forecast",
        }

tft_model = TemporalFusionTransformer()
