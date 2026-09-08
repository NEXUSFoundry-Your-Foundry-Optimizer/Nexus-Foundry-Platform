import asyncio
from datetime import datetime, timedelta
import logging
from typing import Optional

from backend.app.simulator.dataset_loader import dataset_loader
from backend.app.simulator.dataset_mapper import DatasetMapper
from backend.app.simulator.simulator_state import global_simulator_state
from backend.app.mqtt.publisher import mqtt_publisher

logger = logging.getLogger("SensorSimulator")

class SensorSimulator:
    def __init__(self):
        self._task: Optional[asyncio.Task] = None

    async def start(self, dataset_name: str = "furnace_sensor.csv", speed: float = 1.0, batch_id: Optional[str] = None):
        if global_simulator_state.is_running:
            await self.stop()
            
        global_simulator_state.is_running = True
        global_simulator_state.is_paused = False
        global_simulator_state.replay_speed = speed
        global_simulator_state.current_dataset = dataset_name
        global_simulator_state.current_batch_id = batch_id
        global_simulator_state.current_row = 0
        global_simulator_state.records_published = 0
        
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Started SensorSimulator on {dataset_name} at {speed}x speed")

    async def pause(self):
        global_simulator_state.is_paused = True
        logger.info("SensorSimulator paused")

    async def resume(self):
        global_simulator_state.is_paused = False
        logger.info("SensorSimulator resumed")

    async def stop(self):
        global_simulator_state.is_running = False
        global_simulator_state.is_paused = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("SensorSimulator stopped")

    async def _run_loop(self):
        try:
            df = dataset_loader.load_csv(global_simulator_state.current_dataset)
            if global_simulator_state.current_batch_id:
                if "batch_id" in df.columns:
                    df = df[df["batch_id"] == global_simulator_state.current_batch_id]
            
            total_rows = len(df)
            global_simulator_state.total_rows = total_rows
            
            if total_rows == 0:
                logger.warning("No records found for simulation loop")
                global_simulator_state.is_running = False
                return

            sim_start_time = datetime.now()

            while global_simulator_state.is_running and global_simulator_state.current_row < total_rows:
                if global_simulator_state.is_paused:
                    await asyncio.sleep(0.5)
                    continue

                row = df.iloc[global_simulator_state.current_row].to_dict()
                now_str = datetime.now().isoformat()
                global_simulator_state.simulated_timestamp = now_str
                
                # Determine dataset type and map to events
                ds_name = global_simulator_state.current_dataset.lower()
                events = []
                topic = "foundry/sensors/telemetry"
                
                if "furnace" in ds_name:
                    events = DatasetMapper.map_furnace_row(row, now_str)
                    topic = "foundry/sensors/furnace"
                elif "molding" in ds_name:
                    events = DatasetMapper.map_molding_row(row, now_str)
                    topic = "foundry/sensors/molding"
                elif "env" in ds_name:
                    events = DatasetMapper.map_env_row(row, now_str)
                    topic = "foundry/sensors/environmental"
                else:
                    events = [{
                        "sensor_id": "GENERIC_01",
                        "timestamp": now_str,
                        "data": row
                    }]

                # Publish events to MQTT Mosquitto
                for event in events:
                    await mqtt_publisher.publish(topic, event)
                    global_simulator_state.records_published += 1

                global_simulator_state.current_row += 1
                global_simulator_state.progress_percentage = round((global_simulator_state.current_row / total_rows) * 100, 2)

                # Control delay speed
                base_delay = 1.0 / max(0.1, global_simulator_state.replay_speed)
                await asyncio.sleep(base_delay)

            global_simulator_state.is_running = False
            logger.info("SensorSimulator completed replay stream")
            
        except Exception as e:
            logger.error(f"Error in SensorSimulator execution loop: {e}", exc_info=True)
            global_simulator_state.is_running = False

sensor_simulator = SensorSimulator()
