from typing import Optional
from pydantic import BaseModel, Field

class SimulatorState(BaseModel):
    is_running: bool = False
    is_paused: bool = False
    replay_speed: float = Field(default=1.0, ge=0.1, le=100.0)
    current_dataset: str = "furnace_sensor.csv"
    current_batch_id: Optional[str] = None
    current_row: int = 0
    total_rows: int = 0
    progress_percentage: float = 0.0
    simulated_timestamp: Optional[str] = None
    records_published: int = 0
    mode: str = "real-time" # real-time or accelerated

global_simulator_state = SimulatorState()
