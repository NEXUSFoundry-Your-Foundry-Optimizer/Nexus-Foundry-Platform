"""Audit trail for a live, cross-twin anomaly cascade.

The workflow screen consumes this record directly.  It is deliberately built
from the messages and model results produced during a replay, not from UI
defaults, so every step has an inspectable input and output.
"""

from __future__ import annotations

from collections import deque
from datetime import datetime
from typing import Any, Deque, Dict, Optional
from uuid import uuid4

import numpy as np
import pandas as pd

from backend.app.db.redis import redis_manager


def _json_value(value: Any) -> Any:
    """Convert pandas/numpy values into response-safe primitives."""
    if isinstance(value, dict):
        return {str(key): _json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, deque)):
        return [_json_value(item) for item in value]
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    return value


class WorkflowStore:
    def __init__(self, max_size: int = 100) -> None:
        self._records: Deque[Dict[str, Any]] = deque(maxlen=max_size)

    async def record_cascade(
        self,
        *,
        melting_state: Dict[str, Any],
        detection: Dict[str, Any],
        tft_context: Dict[str, Any],
        schedule: Optional[Dict[str, Any]],
        warning: Optional[Dict[str, Any]],
        pouring_state: Optional[Dict[str, Any]],
        anomaly_alert: Optional[Dict[str, Any]],
        risk_alert: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Persist one actual anomaly cascade, including skipped downstream work."""
        forecast = melting_state.get("forecast") if isinstance(melting_state.get("forecast"), dict) else {}
        pouring_context = (pouring_state or {}).get("workflow_context", {}) if pouring_state else {}
        feature_vector = pouring_context.get("feature_vector", {})
        prediction = pouring_context.get("prediction", {})
        explanation = pouring_context.get("explanation", {})
        geometry = pouring_context.get("geometry", {})
        molding_record = pouring_context.get("molding_record", {})
        pouring_record = pouring_context.get("pouring_record", {})
        top_attributions = sorted(
            (explanation.get("feature_attributions") or {}).items(),
            key=lambda item: abs(float(item[1])),
            reverse=True,
        )[:8]

        event_time = str(melting_state.get("updated_at") or datetime.now().isoformat())
        batch_id = str(melting_state.get("batch_id", "BATCH-DEFAULT"))
        workflow_id = f"cascade-{batch_id}-{uuid4().hex[:10]}"
        schedule_found = schedule is not None
        forecast_ready = forecast.get("status") == "completed"
        downstream_ready = schedule_found and forecast_ready
        downstream_status = "completed" if downstream_ready else "skipped"
        downstream_reason = (
            "No pour scheduled in the next 12 hours."
            if not schedule_found
            else "TFT emergency inference did not return a completed forecast; no cross-twin warning was sent."
        )

        steps = [
            {
                "id": 1,
                "name": "LSTM-AE detects anomaly",
                "status": "completed" if forecast_ready else "failed",
                "input": {
                    "source": "Datasets/furnace_sensor.csv live replay row",
                    "batch_id": batch_id,
                    "telemetry": {
                        key: melting_state.get(key)
                        for key in ("melt_temp", "power_kw", "vibration_g", "lining_health", "operating_state")
                    },
                },
                "output": detection,
            },
            {
                "id": 2,
                "name": "Melting Twin triggers TFT emergency run",
                "status": "completed",
                "input": {
                    "trigger": "LSTM-AE anomaly_score > threshold",
                    "anomaly_window_rows": 30,
                    "history_source": tft_context.get("source_file"),
                    "requested_history_hours": tft_context.get("requested_lookback_hours"),
                    "history_source_rows": tft_context.get("source_rows"),
                    "history_samples_used": tft_context.get("selected_samples"),
                    "history_start": tft_context.get("start_time"),
                    "history_end": tft_context.get("end_time"),
                },
                "output": {
                    "model": forecast.get("model"),
                    "model_source": forecast.get("model_source"),
                    "horizon_hours": forecast.get("horizon_hours"),
                    "status": forecast.get("status", "completed"),
                },
            },
            {
                "id": 3,
                "name": "TFT returns forecast",
                "status": "completed" if forecast_ready else "failed",
                "input": {
                    "current_melt_temp": melting_state.get("melt_temp"),
                    "current_lining_health": melting_state.get("lining_health"),
                    "forecast_at": event_time,
                },
                "output": {
                    "next_two_hours": (forecast.get("forecasts") or [])[:2],
                    "forecast_9pm_temperature": forecast.get("forecast_9pm_temperature"),
                    "failure_time": forecast.get("failure_time"),
                    "attention_weights": forecast.get("attention_weights"),
                },
            },
            {
                "id": 4,
                "name": "Melting Twin checks pour schedule",
                "status": "completed",
                "input": {
                    "source": "Datasets/production_master.csv",
                    "batch_id": batch_id,
                    "window_start": event_time,
                    "window_hours": 12,
                },
                "output": {"scheduled": schedule_found, "schedule": schedule},
            },
            {
                "id": 5,
                "name": "Melting Twin sends warning to Pouring Twin",
                "status": downstream_status,
                "input": {
                    "severity": detection.get("anomaly_score"),
                    "projected_temp": forecast.get("forecast_9pm_temperature"),
                    "lining_health": melting_state.get("lining_health"),
                    "failure_time": forecast.get("failure_time"),
                },
                "output": warning if warning else {"reason": downstream_reason},
            },
            {
                "id": 6,
                "name": "Pouring Twin receives warning",
                "status": downstream_status,
                "input": warning or {},
                "output": {
                    "acknowledged": bool(pouring_state and pouring_state.get("upstream_anomaly")),
                    "stage": pouring_state.get("stage") if pouring_state else "not-run",
                    "batch_id": pouring_state.get("batch_id") if pouring_state else batch_id,
                },
            },
            {
                "id": 7,
                "name": "Pouring Twin queries Molding Twin",
                "status": downstream_status,
                "input": {"source": "Datasets/molding_sensor.csv", "batch_id": batch_id},
                "output": molding_record if downstream_ready else {"reason": downstream_reason},
            },
            {
                "id": 8,
                "name": "Pouring Twin queries CAD database",
                "status": downstream_status,
                "input": {"source": "Datasets/geometry_metadata.csv", "part_name": schedule.get("part_name") if schedule else None},
                "output": geometry if downstream_ready else {"reason": downstream_reason},
            },
            {
                "id": 9,
                "name": "Pouring Twin assembles XGBoost features",
                "status": downstream_status,
                "input": {
                    "sources": ["melting warning", "molding CSV", "pouring CSV", "CAD embedding", "xgboost feature schema"],
                    "expected_feature_count": 65,
                },
                "output": {
                    "feature_count": len(feature_vector),
                    "features": feature_vector,
                } if downstream_ready else {"reason": downstream_reason},
            },
            {
                "id": 10,
                "name": "Pouring Twin calls XGBoost + SHAP",
                "status": downstream_status,
                "input": {"feature_count": len(feature_vector), "features": feature_vector},
                "output": {
                    "prediction": prediction,
                    "top_shap_attributions": [{"feature": key, "value": value} for key, value in top_attributions],
                    "shap_contribution_groups": explanation.get("contribution_groups", {}),
                    "shap_base_value": explanation.get("base_value"),
                    "shap_model_source": explanation.get("model_source"),
                } if downstream_ready else {"reason": downstream_reason},
            },
            {
                "id": 11,
                "name": "Alert generated",
                "status": "completed" if risk_alert else ("not-triggered" if downstream_ready else "skipped"),
                "input": {
                    "defect_probability": prediction.get("defect_probability"),
                    "critical_threshold": 0.7,
                },
                "output": risk_alert or {
                    "reason": "Defect probability did not reach the critical alert threshold."
                    if downstream_ready
                    else downstream_reason
                },
            },
        ]

        record = _json_value({
            "workflow_id": workflow_id,
            "batch_id": batch_id,
            "event_time": event_time,
            "status": "completed" if downstream_ready else (
                "stopped_no_scheduled_pour" if not schedule_found else "stopped_tft_unavailable"
            ),
            "steps": steps,
            "anomaly_alert": anomaly_alert,
            "risk_alert": risk_alert,
        })
        self._records.append(record)
        await redis_manager.set("workflow:latest", record, ttl=86400)
        await redis_manager.set(f"workflow:{workflow_id}", record, ttl=86400)
        return record

    async def latest(self) -> Optional[Dict[str, Any]]:
        cached = await redis_manager.get("workflow:latest")
        if cached is not None:
            return cached
        return self._records[-1] if self._records else None


workflow_store = WorkflowStore()
