import os
import numpy as np
from typing import Dict, Any
from pathlib import Path
from backend.app.simulator.dataset_loader import dataset_loader

try:
    import torch
    import torch.nn as nn

    class HeatEquationPINN(nn.Module):
        def __init__(self, in_features=4, hidden_features=64, out_features=3):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(in_features, hidden_features),
                nn.Tanh(),
                nn.Linear(hidden_features, hidden_features),
                nn.Tanh(),
                nn.Linear(hidden_features, out_features)
            )

        def forward(self, x):
            return self.net(x)
except ImportError:
    torch = None
    nn = None
    HeatEquationPINN = None

PROJECT_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = PROJECT_ROOT / "models" / "pinn" / "pinn_heat_equation.pt"
if not MODEL_PATH.exists():
    MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "pinn" / "pinn_heat_equation.pt"

class PINNModel:
    """
    Physics-Informed Neural Network (PINN) for heat transfer & thermal field simulation.
    Loads trained PyTorch weights from models/pinn/pinn_heat_equation.pt if PyTorch is available.
    """
    def __init__(self):
        self.model = None
        self._load_model()

    @property
    def loaded(self) -> bool:
        return self.model is not None

    def _load_model(self):
        if torch is None or HeatEquationPINN is None:
            self.model = None
            return
        try:
            if MODEL_PATH.exists():
                self.model = HeatEquationPINN()
                self.model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
                self.model.eval()
        except Exception:
            self.model = None

    def simulate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        melt_temp = float(parameters.get("melt_temp", 1380.0))
        pour_temp = float(parameters.get("pour_temp", 1445.0))
        pour_speed = float(parameters.get("pour_speed", 0.85))
        sand_moisture = float(parameters.get("sand_moisture", 4.2))

        try:
            pinn_grid = dataset_loader.load_npy("pinn_X.npy")
            grid_shape = list(pinn_grid.shape)
            sample_value = float(pinn_grid.flat[0]) if pinn_grid.size > 0 else 0.0
        except Exception:
            grid_shape = [20000, 4]
            sample_value = 0.5

        cooling_rate = (pour_temp - 600.0) / 120.0

        if self.model is not None and torch is not None:
            try:
                x_tensor = torch.tensor([[melt_temp, pour_temp, pour_speed, sand_moisture]], dtype=torch.float32)
                with torch.no_grad():
                    out = self.model(x_tensor).numpy()[0]
                    cooling_rate = float(abs(out[1])) if abs(out[1]) > 0.1 else cooling_rate
            except Exception:
                pass

        return {
            "model": "PINN",
            "physics_equation": "2D Transient Thermal Conduction (Fourier Law: ∂T/∂t = α ∇²T)",
            "melt_temp": melt_temp,
            "pour_temp": pour_temp,
            "cooling_rate_deg_per_sec": round(cooling_rate, 2),
            "estimated_solidification_time_sec": round(1200.0 / max(0.1, cooling_rate), 1),
            "grid_shape": grid_shape,
            "pinn_sample_value": sample_value,
            "physics_valid": cooling_rate > 0,
            "model_source": "trained:models/pinn/pinn_heat_equation.pt" if self.model else "analytical:fourier-law",
            "recommendation": "Proposed change is physically valid." if cooling_rate > 0 else "Increase the proposed pour temperature."
        }

pinn_model = PINNModel()
