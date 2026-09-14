from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from backend.app.simulator.replay_controller import replay_controller
from backend.app.simulator.dataset_loader import dataset_loader
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.molding import molding_twin
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.ml.pinn import pinn_model
from backend.app.ml.xgboost_model import xgboost_model

router = APIRouter(prefix="/simulation", tags=["Simulation"])

class WhatIfRequest(BaseModel):
    twin: str = Field(pattern="^(melting|molding|pouring)$")
    parameters: dict[str, float] = {}

@router.post("/start")
async def start_simulation(
    dataset_name: str = Query("furnace_sensor.csv"),
    speed: float = Query(1.0, ge=0.1, le=100.0),
    batch_id: Optional[str] = Query(None)
):
    return await replay_controller.start(dataset_name=dataset_name, speed=speed, batch_id=batch_id)

@router.post("/pause")
async def pause_simulation():
    return await replay_controller.pause()

@router.post("/resume")
async def resume_simulation():
    return await replay_controller.resume()

@router.post("/stop")
async def stop_simulation():
    return await replay_controller.stop()

@router.post("/restart")
async def restart_simulation(
    dataset_name: str = Query("furnace_sensor.csv"),
    speed: float = Query(1.0)
):
    await replay_controller.stop()
    return await replay_controller.start(dataset_name=dataset_name, speed=speed)

@router.get("/status")
async def get_simulation_status():
    return await replay_controller.get_status()

@router.get("/progress")
async def get_simulation_progress():
    status = await replay_controller.get_status()
    return {
        "current_row": status.get("current_row"),
        "total_rows": status.get("total_rows"),
        "progress_percentage": status.get("progress_percentage"),
        "records_published": status.get("records_published")
    }

@router.post("/what-if")
async def what_if(request: WhatIfRequest):
    states = {"melting": melting_twin.get_state(), "molding": molding_twin.get_state(), "pouring": pouring_twin.get_state()}
    current = {**states[request.twin], **request.parameters}
    simulation = pinn_model.simulate(current)
    risk = xgboost_model.predict({**states["melting"], **states["molding"], **states["pouring"], **request.parameters})
    return {
        "twin": request.twin,
        "predicted_state": {**current, "pour_temp": simulation["pour_temp"]},
        "new_predicted_state": simulation,
        "risk": risk["defect_probability"],
        "previous_risk": pouring_twin.get_state().get("pre_pour_risk", 0.0),
        "physics_valid": simulation["physics_valid"],
        "cooling_rate": simulation["cooling_rate_deg_per_sec"],
        "recommendation": simulation["recommendation"],
    }


