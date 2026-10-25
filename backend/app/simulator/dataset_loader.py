import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
import logging
from backend.app.config import settings

logger = logging.getLogger("DatasetLoader")

class DatasetLoader:
    def __init__(self, dataset_dir: Optional[str] = None):
        if dataset_dir:
            self.dataset_dir = dataset_dir
        else:
            candidates = [
                settings.DATASETS_DIR,
                os.path.join(os.getcwd(), "Datasets"),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Datasets")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Datasets")),
                "./Datasets",
            ]
            self.dataset_dir = next((c for c in candidates if os.path.isdir(c)), settings.DATASETS_DIR)
        self._cache: Dict[str, pd.DataFrame] = {}

    def load_csv(self, filename: str) -> pd.DataFrame:
        if filename in self._cache:
            return self._cache[filename]
            
        file_path = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(file_path):
            if filename == "production_master.csv":
                df = pd.DataFrame([{
                    "batch_id": "BATCH-20260301-0001",
                    "part_name": "Brake_Drum_v1",
                    "alloy_grade": "C25",
                    "mold_id": "MOLD-0001",
                    "shift": "A",
                    "cycle_number": 1792,
                    "production_order": "PO-20260301-0001",
                    "furnace_id": "FURNACE_3",
                    "molding_machine_id": "MOLDING_LINE_2",
                    "pouring_station_id": "LADLE_1",
                    "period": "normal",
                    "target_temperature": 1421.78,
                    "target_pour_time": "2026-03-01 07:52:38",
                    "mold_made_at": "2026-02-28 18:54:38",
                    "pour_time": "2026-03-01 07:52:38",
                    "inspection_time": "2026-03-01 11:52:38",
                    "production_date": "2026-03-01"
                }])
                self._cache[filename] = df
                return df
            if filename == "geometry_metadata.csv":
                df = pd.DataFrame([{
                    "part_name": "Brake_Drum_v1",
                    "shape_embedding": str([0.1] * 50)
                }])
                self._cache[filename] = df
                return df
            raise FileNotFoundError(f"Dataset file {filename} not found at {file_path}")
            
        df = pd.read_csv(file_path)
        self._cache[filename] = df
        return df

    def load_npy(self, filename: str) -> np.ndarray:
        file_path = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(file_path):
            return np.zeros((20000, 4), dtype=np.float32)
        return np.load(file_path)

    def _fallback_rows(self, filename: str, batch_id: Optional[str] = None):
        if filename == "furnace_sensor.csv":
            for i in range(1000):
                is_incident = 25 <= i <= 50
                temp = 1560.0 if is_incident else (1380.0 + (i % 5))
                vib = 0.1818 if is_incident else 0.0310
                lining = 0.61 if is_incident else max(0.5, 0.85 - (i * 0.001))
                power = 1240.0 if is_incident else 795.0
                yield {
                    "timestamp": f"01-03-2026 05:{i%60:02d}",
                    "batch_id": batch_id or "BATCH-20260301-0001",
                    "furnace_id": "FURNACE_3",
                    "melt_temp": temp,
                    "power_kw": power,
                    "vibration_g": vib,
                    "lining_health_index": lining,
                    "operating_state": "Melting",
                    "cooling_water_inlet_temp": 18.5,
                    "cooling_water_outlet_temp": 48.0 if is_incident else 32.0,
                }
        elif filename == "pouring_sensor.csv":
            for i in range(500):
                yield {
                    "timestamp": f"2026-03-01T07:52:{i%60:02d}",
                    "batch_id": batch_id or "BATCH-20260301-0001",
                    "ladle_id": "LADLE_1",
                    "pour_temp": 1421.0 + (i % 4),
                    "pour_speed": 0.85,
                    "ladle_fill_pct": max(0.0, 100.0 - (i % 100)),
                    "flow_rate_kgps": 27.5,
                    "stage": "Pouring",
                }
        elif filename == "molding_sensor.csv":
            for i in range(100):
                yield {
                    "timestamp": "2026-02-28 18:54:38",
                    "batch_id": batch_id or "BATCH-20260301-0001",
                    "mold_id": "MOLD-0001",
                    "molding_machine_id": "MOLDING_LINE_2",
                    "sand_moisture": 4.25,
                    "permeability": 0.88,
                    "green_strength": 123.2,
                    "compactability": 42.0,
                }

    def iter_rows(self, filename: str, batch_id: Optional[str] = None):
        """Stream CSV rows so large sensor replays do not require a full in-memory frame."""
        file_path = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(file_path):
            logger.warning(f"Dataset file {filename} not found at {file_path}, falling back to generator")
            for row in self._fallback_rows(filename, batch_id=batch_id):
                yield row
            return

        for chunk in pd.read_csv(file_path, chunksize=4096):
            if batch_id and "batch_id" in chunk.columns:
                chunk = chunk[chunk["batch_id"] == batch_id]
            for row in chunk.to_dict(orient="records"):
                yield row

    def count_rows(self, filename: str, batch_id: Optional[str] = None) -> int:
        file_path = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(file_path):
            return 1000
        return sum(1 for _ in self.iter_rows(filename, batch_id=batch_id))

    def list_datasets(self) -> Dict[str, Any]:
        if not os.path.exists(self.dataset_dir):
            return {"error": "Datasets directory missing", "files": []}
            
        files = os.listdir(self.dataset_dir)
        info = []
        for file in files:
            full_path = os.path.join(self.dataset_dir, file)
            size_mb = round(os.path.getsize(full_path) / (1024 * 1024), 2)
            info.append({"filename": file, "size_mb": size_mb})
            
        return {"directory": self.dataset_dir, "files": info}

    def temporal_context(
        self,
        filename: str,
        end_time: str,
        *,
        furnace_id: Optional[str] = None,
        lookback_hours: int = 24 * 7,
        max_samples: int = 168,
    ) -> Dict[str, Any]:
        """Return a bounded, chronological CSV context for a time-series model."""
        try:
            frame = self.load_csv(filename)
        except Exception:
            return {"rows": [], "source_rows": 0, "selected_samples": 0}

        if "timestamp" not in frame.columns:
            return {"rows": [], "source_rows": 0, "selected_samples": 0}

        timestamps = pd.to_datetime(frame["timestamp"], format="mixed", errors="coerce")
        target_time = pd.to_datetime(end_time, format="mixed", errors="coerce")
        if pd.isna(target_time):
            return {"rows": [], "source_rows": 0, "selected_samples": 0}

        mask = (timestamps <= target_time) & (timestamps >= target_time - pd.Timedelta(hours=lookback_hours))
        if furnace_id and "furnace_id" in frame.columns:
            mask &= frame["furnace_id"].astype(str) == str(furnace_id)

        window = frame.loc[mask].copy()
        if window.empty:
            return {
                "rows": [],
                "source_rows": 0,
                "selected_samples": 0,
                "requested_lookback_hours": lookback_hours,
            }

        window["__timestamp"] = timestamps.loc[window.index]
        window = window.sort_values("__timestamp")
        source_rows = len(window)
        if source_rows > max_samples:
            sample_indexes = np.linspace(0, source_rows - 1, num=max_samples, dtype=int)
            window = window.iloc[sample_indexes]

        available_hours = max(
            0.0,
            (window["__timestamp"].iloc[-1] - window["__timestamp"].iloc[0]).total_seconds() / 3600,
        )
        rows = window.drop(columns="__timestamp").where(pd.notnull(window), None).to_dict(orient="records")
        return {
            "rows": rows,
            "source_rows": source_rows,
            "selected_samples": len(rows),
            "requested_lookback_hours": lookback_hours,
            "available_hours": round(available_hours, 3),
            "start_time": str(window["timestamp"].iloc[0]),
            "end_time": str(window["timestamp"].iloc[-1]),
            "source_file": filename,
        }

dataset_loader = DatasetLoader()
