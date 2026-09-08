from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.app.simulator.replay_controller import replay_controller
from backend.app.simulator.dataset_loader import dataset_loader

router = APIRouter(prefix="/simulation", tags=["Simulation"])

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
