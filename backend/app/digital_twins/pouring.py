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
            "workflow_context": {},
            "stage": "Pouring",
            "updated_at": datetime.now().isoformat()
        }

    async def process_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        if not self.current_state.get("upstream_anomaly"):
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
        await redis_manager.set_digital_twin_state("pouring", self.current_state["batch_id"], self.current_state)
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

        # Each lookup below is performed against the source CSV for the batch
        # that received the warning.  Do not reuse whichever batch happens to
        # be passing through the independent live loops at this instant.
        mold = self._find_molding_record(batch_id) or molding_state
        pour = self._find_pouring_record(batch_id)
        feature_source = self._find_feature_record(batch_id)
        geometry = self._find_geometry_record(schedule.get("part_name"))
        features = self._assemble_features(warning, mold, pour, schedule, feature_source, geometry)
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
            "model_source": prediction.get("model_source", "artifact:models/xgboost/xgboost_model.json"),
            "shap_model_source": explanation.get("model_source", "artifact:models/xgboost/shap_explainer.pkl"),
            "shap_summary": explanation["feature_attributions"],
            "top_risk_driver": explanation["top_risk_driver"],
            "workflow_context": {
                "molding_record": mold,
                "pouring_record": pour,
                "geometry": geometry,
                "feature_vector": features,
                "prediction": prediction,
                "explanation": explanation,
            },
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
    def _find_pouring_record(batch_id: str) -> Dict[str, Any]:
        first: Dict[str, Any] | None = None
        last: Dict[str, Any] | None = None
        for row in dataset_loader.iter_rows("pouring_sensor.csv", batch_id=batch_id):
            first = first or row
            last = row
        if first is None:
            return {}
        if last and first.get("timestamp") and last.get("timestamp"):
            try:
                first["pour_duration_sec"] = max(
                    0.0,
                    (datetime.fromisoformat(str(last["timestamp"])) - datetime.fromisoformat(str(first["timestamp"]))).total_seconds(),
                )
            except ValueError:
                pass
        return first

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

    def _assemble_features(
        self,
        warning: Dict[str, Any],
        molding: Dict[str, Any],
        pouring: Dict[str, Any],
        schedule: Dict[str, Any],
        source: Dict[str, Any],
        geometry: Dict[str, Any],
    ) -> Dict[str, Any]:
        features = {**source, **molding, **pouring}
        if not source.get("shape_0") and len(geometry.get("shape_embedding", [])) >= 50:
            features.update({f"shape_{index}": value for index, value in enumerate(geometry["shape_embedding"][:50])})
        alloy_grades = sorted(
            str(value) for value in dataset_loader.load_csv("production_master.csv")["alloy_grade"].dropna().unique()
        )
        production_row = next(
            (
                row for row in dataset_loader.load_csv("production_master.csv").to_dict(orient="records")
                if str(row.get("batch_id")) == str(schedule["batch_id"])
            ),
            {},
        )
        alloy_grade = str(production_row.get("alloy_grade", ""))
        alloy_code = float(alloy_grades.index(alloy_grade)) if alloy_grade in alloy_grades else 0.0
        features.update({
            "batch_id": schedule["batch_id"],
            "melt_temp": float(warning.get("projected_temp", features.get("melt_temp", self.current_state["pour_temp"]))),
            "power_kw": float(warning.get("power_kw", features.get("power_kw", 0.0))),
            "vibration_g": float(warning.get("vibration_g", features.get("vibration_g", 0.0))),
            "lining_health": float(warning.get("lining_health", features.get("lining_health", 0.0))),
            "operating_state_encoded": float(features.get("operating_state_encoded", features.get("operating_state", 0.0))),
            "sand_moisture": float(molding.get("sand_moisture", features.get("sand_moisture", 0.0))),
            "permeability": float(molding.get("permeability", features.get("permeability", 0.0))),
            "compactness": float(molding.get("compactability", molding.get("compactness", 0.0))),
            "pour_temp": float(features.get("pour_temp", self.current_state["pour_temp"])),
            "pour_speed": float(features.get("pour_speed", self.current_state["pour_speed"])),
            "pour_duration_sec": float(pouring.get("pour_duration_sec", source.get("pour_duration_sec", 0.0))),
            "ladle_fill": float(pouring.get("ladle_fill_pct", source.get("ladle_fill", self.current_state.get("ladle_fill_pct", 0.0)))),
            "ambient_air_temp": float(source.get("ambient_temp", source.get("ambient_air_temp", 0.0))),
            "ambient_air_humidity": float(source.get("ambient_humidity", source.get("ambient_air_humidity", 0.0))),
            "alloy_grade_encoded": alloy_code,
        })
        return {name: features.get(name, 0.0) for name in xgboost_model.feature_names}

    def get_state(self) -> Dict[str, Any]:
        return self.current_state

pouring_twin = PouringTwin()
