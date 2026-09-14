import os
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from backend.app.config import settings

class DatasetLoader:
    def __init__(self, dataset_dir: Optional[str] = None):
        self.dataset_dir = dataset_dir or settings.DATASETS_DIR
        self._cache: Dict[str, pd.DataFrame] = {}

    def load_csv(self, filename: str) -> pd.DataFrame:
        if filename in self._cache:
            return self._cache[filename]
            
        file_path = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset file {filename} not found at {file_path}")
            
        df = pd.read_csv(file_path)
        self._cache[filename] = df
        return df

    def load_npy(self, filename: str) -> np.ndarray:
        file_path = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"NPY dataset file {filename} not found at {file_path}")
        return np.load(file_path)

    def iter_rows(self, filename: str, batch_id: Optional[str] = None):
        """Stream CSV rows so large sensor replays do not require a full in-memory frame."""
        file_path = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Dataset file {filename} not found at {file_path}")
        for chunk in pd.read_csv(file_path, chunksize=4096):
            if batch_id and "batch_id" in chunk.columns:
                chunk = chunk[chunk["batch_id"] == batch_id]
            for row in chunk.to_dict(orient="records"):
                yield row

    def count_rows(self, filename: str, batch_id: Optional[str] = None) -> int:
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
        """Return a bounded, chronological CSV context for a time-series model.

        The live replay intentionally streams the furnace CSV one row at a time.
        An emergency forecast still needs historical context, so this method reads
        the same source CSV, constrains it to the real event timestamp and
        down-samples it without fabricating any observations.
        """
        frame = self.load_csv(filename)
        if "timestamp" not in frame.columns:
            return {"rows": [], "source_rows": 0, "selected_samples": 0}

        timestamps = pd.to_datetime(frame["timestamp"], errors="coerce")
        target_time = pd.to_datetime(end_time, errors="coerce")
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
