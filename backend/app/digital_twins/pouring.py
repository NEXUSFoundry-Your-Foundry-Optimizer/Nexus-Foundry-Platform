from datetime import datetime
import ast
from typing import Dict, Any
from backend.app.digital_twins.base import BaseDigitalTwin
from backend.app.db.redis import redis_manager
from backend.app.ml.xgboost_model import xgboost_model
from backend.app.ml.shap_explainer import shap_explainer
from backend.app.simulator.dataset_loader import dataset_loader

class PouringTwin(BaseDigitalTwin):
    def __init__(self):
        super().__init__("pouring")
        self.current_state = {
            "batch_id": "BATCH-DEFAULT",
            "ladle_id": "LADLE_1",
            "pour_temp": 1445.0,
            "pour_speed": 0.85,
            "ladle_fill_pct": 88.0,
            "flow_rate_kgps": 28.5,
            "pre_pour_risk": 0.12,
            "feature_count": 0,
            "shap_summary": {},
            "pour_schedule": None,
            "geometry_metadata": None,
            "stage": "Pouring",
            "updated_at": datetime.now().isoformat()
        }

    async def process_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        batch_id = event.get("batch_id", self.current_state["batch_id"])
        self.current_state["batch_id"] = batch_id
        
        if "pour_temp" in event:
            self.current_state["pour_temp"] = float(event["pour_temp"])
        if "pour_speed" in event:
            self.current_state["pour_speed"] = float(event["pour_speed"])
        if "ladle_fill_pct" in event:
            self.current_state["ladle_fill_pct"] = float(event["ladle_fill_pct"])
            
        self.current_state["updated_at"] = datetime.now().isoformat()
        
        # Persist to Redis
        await redis_manager.set_digital_twin_state("pouring", batch_id, self.current_state)
        return self.current_state

    async def receive_upstream_warning(self, warning: Dict[str, Any], molding_state: Dict[str, Any]) -> Dict[str, Any]:
        batch_id = str(warning.get("batch_id", self.current_state["batch_id"]))
        source_time = datetime.fromisoformat(str(warning.get("timestamp", datetime.now().isoformat())))
        schedule = warning.get("pour_schedule") or self._find_pour_schedule(batch_id, source_time)
        self.current_state["pour_schedule"] = schedule
        if schedule is None:
            self.current_state["upstream_anomaly"] = False
            self.current_state["stage"] = "Awaiting scheduled pour"
            return self.current_state

        mold = self._find_molding_record(batch_id) or molding_state
        feature_source = self._find_feature_record(batch_id)
        geometry = self._find_geometry_record(schedule.get("part_name"))
        features = self._assemble_features(warning, mold, schedule, feature_source, geometry)
        self.current_state.update({
            "batch_id": batch_id,
            "upstream_risk": float(warning.get("severity", warning.get("anomaly_score", 0.0))),
            "upstream_anomaly": True,
            "warning": warning,
            "feature_count": len(features),
            "shape_embedding": [features.get(f"shape_{index}", 0.0) for index in range(50)],
            "geometry_metadata": geometry,
        })
        prediction = xgboost_model.predict(features)
        explanation = shap_explainer.explain(batch_id, features)
        self.current_state.update({
            "pre_pour_risk": prediction["defect_probability"],
            "defect_probability": prediction["defect_probability"],
            "quality_prediction": prediction["quality_prediction"],
            "model_source": prediction.get("model_source", "unknown"),
            "shap_model_source": explanation.get("model_source", "unknown"),
            "shap_summary": explanation["feature_attributions"],
            "top_risk_driver": explanation["top_risk_driver"],
            "updated_at": warning.get("timestamp", datetime.now().isoformat()),
        })
        await redis_manager.set_digital_twin_state("pouring", self.current_state["batch_id"], self.current_state)
        return self.current_state

    @staticmethod
    def _find_pour_schedule(batch_id: str, source_time: datetime) -> Dict[str, Any] | None:
        for row in dataset_loader.load_csv("production_master.csv").to_dict(orient="records"):
            if str(row.get("batch_id")) != batch_id or not row.get("pour_time"):
                continue
            pour_time = datetime.fromisoformat(str(row["pour_time"]))
            hours_until_pour = (pour_time - source_time).total_seconds() / 3600
            if 0 <= hours_until_pour <= 12:
                return {"batch_id": batch_id, "time": pour_time.isoformat(), "hours_until_pour": round(hours_until_pour, 2), "part_name": row.get("part_name"), "mold_id": row.get("mold_id")}
        return None

    @staticmethod
    def _find_molding_record(batch_id: str) -> Dict[str, Any] | None:
        for row in dataset_loader.iter_rows("molding_sensor.csv", batch_id=batch_id):
            return row
        return None

    @staticmethod
    def _find_feature_record(batch_id: str) -> Dict[str, Any]:
        for row in dataset_loader.iter_rows("xgboost_features.csv", batch_id=batch_id):
            return row
        return {}

    @staticmethod
    def _find_geometry_record(part_name: Any) -> Dict[str, Any]:
        if not part_name:
            return {}
        for row in dataset_loader.load_csv("geometry_metadata.csv").to_dict(orient="records"):
            if str(row.get("part_name")) == str(part_name):
                embedding = row.get("shape_embedding", "[]")
                try:
                    row["shape_embedding"] = [float(value) for value in ast.literal_eval(str(embedding))]
                except (ValueError, SyntaxError):
                    row["shape_embedding"] = []
                return row
        return {}

    def _assemble_features(self, warning: Dict[str, Any], molding: Dict[str, Any], schedule: Dict[str, Any], source: Dict[str, Any], geometry: Dict[str, Any]) -> Dict[str, Any]:
        features = {**source, **molding, **self.current_state}
        if not source.get("shape_0") and len(geometry.get("shape_embedding", [])) >= 50:
            features.update({f"shape_{index}": value for index, value in enumerate(geometry["shape_embedding"][:50])})
        features.update({
            "batch_id": schedule["batch_id"],
            "melt_temp": warning.get("projected_temp", features.get("melt_temp", self.current_state["pour_temp"])),
            "vibration_g": warning.get("vibration_g", features.get("vibration_g", 0.03)),
            "lining_health": warning.get("lining_health", features.get("lining_health", 0.0)),
            "pour_temp": features.get("pour_temp", self.current_state["pour_temp"]),
            "pour_speed": features.get("pour_speed", self.current_state["pour_speed"]),
            "ladle_fill_pct": features.get("ladle_fill_pct", self.current_state["ladle_fill_pct"]),
        })
        return {name: features.get(name, 0.0) for name in xgboost_model.feature_names}

    def get_state(self) -> Dict[str, Any]:
        return self.current_state

pouring_twin = PouringTwin()
