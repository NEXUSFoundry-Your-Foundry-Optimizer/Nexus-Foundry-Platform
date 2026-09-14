import os
import torch
import torch.nn as nn
import numpy as np

# Create models directory structure
os.makedirs("models/tft", exist_ok=True)
os.makedirs("models/pinn", exist_ok=True)

# 1. TFT PyTorch Model Architecture
class PyTorchTFT(nn.Module):
    def __init__(self, input_dim=7, hidden_dim=64, horizon=48):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.attention = nn.Linear(hidden_dim, input_dim)
        # Outputs P10, P50, P90 quantile forecasts for 48 hours
        self.fc = nn.Linear(hidden_dim, horizon * 3)

    def forward(self, x):
        out, (hn, cn) = self.lstm(x)
        weights = torch.softmax(self.attention(out[:, -1, :]), dim=-1)
        quantiles = self.fc(hn[-1])
        return quantiles, weights

# 2. PINN PyTorch Heat Equation Physics Model Architecture
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

def export_models():
    print("Exporting PyTorch TFT weights to models/tft/tft_model.pt...")
    tft = PyTorchTFT()
    torch.save(tft.state_dict(), "models/tft/tft_model.pt")
    print("Successfully saved models/tft/tft_model.pt.")

    print("Exporting PyTorch PINN weights to models/pinn/pinn_heat_equation.pt...")
    pinn = HeatEquationPINN()
    torch.save(pinn.state_dict(), "models/pinn/pinn_heat_equation.pt")
    print("Successfully saved models/pinn/pinn_heat_equation.pt.")

if __name__ == "__main__":
    export_models()
