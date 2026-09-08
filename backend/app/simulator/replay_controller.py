from typing import Optional, Dict, Any
from backend.app.simulator.sensor_simulator import sensor_simulator
from backend.app.simulator.simulator_state import global_simulator_state

class ReplayController:
    async def start(self, dataset_name: str = "furnace_sensor.csv", speed: float = 1.0, batch_id: Optional[str] = None) -> Dict[str, Any]:
        await sensor_simulator.start(dataset_name=dataset_name, speed=speed, batch_id=batch_id)
        return {"status": "started", "state": global_simulator_state.dict()}

    async def pause(self) -> Dict[str, Any]:
        await sensor_simulator.pause()
        return {"status": "paused", "state": global_simulator_state.dict()}

    async def resume(self) -> Dict[str, Any]:
        await sensor_simulator.resume()
        return {"status": "resumed", "state": global_simulator_state.dict()}

    async def stop(self) -> Dict[str, Any]:
        await sensor_simulator.stop()
        return {"status": "stopped", "state": global_simulator_state.dict()}

    async def get_status(self) -> Dict[str, Any]:
        return global_simulator_state.dict()

replay_controller = ReplayController()
