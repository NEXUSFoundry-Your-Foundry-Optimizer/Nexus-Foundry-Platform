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

dataset_loader = DatasetLoader()
