import asyncio
from datetime import datetime
import logging
from typing import Optional

from backend.app.simulator.dataset_loader import dataset_loader
from backend.app.simulator.dataset_mapper import DatasetMapper
from backend.app.simulator.simulator_state import global_simulator_state
from backend.app.mqtt.publisher import mqtt_publisher
from backend.app.digital_twins.melting import melting_twin
from backend.app.digital_twins.molding import molding_twin
from backend.app.websocket.manager import ws_manager
from backend.app.digital_twins.pouring import pouring_twin
from backend.app.digital_twins.quality import quality_twin
from backend.app.ml.resnet import resnet_classifier
from backend.app.db.influxdb import influx_manager
from backend.app.alerts import alert_store

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
            dataset_name = global_simulator_state.current_dataset
            batch_id = global_simulator_state.current_batch_id
            total_rows = dataset_loader.count_rows(dataset_name, batch_id=batch_id)
            global_simulator_state.total_rows = total_rows
            
            if total_rows == 0:
                logger.warning("No records found for simulation loop")
                global_simulator_state.is_running = False
                return

            previous_source_time = None
            for row in dataset_loader.iter_rows(dataset_name, batch_id=batch_id):
                if not global_simulator_state.is_running:
                    break
                if global_simulator_state.is_paused:
                    await asyncio.sleep(0.25)
                    continue

                ds_name = dataset_name.lower()
                source_value = row.get("timestamp")
                try:
                    source_time = datetime.fromisoformat(str(source_value)) if source_value else datetime.now()
                except ValueError:
                    source_time = datetime.now()
                now_str = source_time.isoformat()
                global_simulator_state.simulated_timestamp = now_str
                state = None
                topic = "foundry/sensors/telemetry"
                events = []

                if "furnace" in ds_name:
                    state = await melting_twin.process_row(row, now_str)
                    events = DatasetMapper.map_furnace_row(row, now_str)
                    topic = "foundry/sensors/furnace"
                    await self._publish_events(topic, events)
                    await influx_manager.write_sensor_measurement("furnace", {"batch_id": state["batch_id"], "furnace_id": state["furnace_id"]}, {key: float(value) for key, value in row.items() if key in {"melt_temp", "power_kw", "vibration_g", "lining_health_index"}})
                    await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="melting")
                    molding_snapshot = {**molding_twin.get_state(), "batch_id": state["batch_id"], "updated_at": now_str}
                    pouring_snapshot = {**pouring_twin.get_state(), "batch_id": state["batch_id"], "updated_at": now_str}
                    await ws_manager.broadcast_digital_twin_update(state["batch_id"], molding_snapshot, twin="molding")
                    await ws_manager.broadcast_digital_twin_update(state["batch_id"], pouring_snapshot, twin="pouring")
                    if state.get("anomaly_flag"):
                        alert_store.record_threshold(
                            twin="melting",
                            batch_id=state["batch_id"],
                            severity="critical",
                            event_time=now_str,
                            event_key=f"melting-anomaly:{state['batch_id']}:{now_str}",
                            message=f"LSTM-AE anomaly detected: score {state['anomaly_score']:.2f} exceeded threshold 0.78.",
                        )
                        forecast = state.get("forecast", {})
                        schedule = melting_twin.get_next_pour_schedule(state["batch_id"], source_time)
                        if schedule is not None:
                            warning = {
                                "batch_id": state["batch_id"],
                                "timestamp": now_str,
                                "severity": state["anomaly_score"],
                                "anomaly_score": state["anomaly_score"],
                                "projected_temp": forecast.get("forecast_9pm_temperature", state["melt_temp"]),
                                "lining_health": state["lining_health"],
                                "failure_time": forecast.get("failure_time"),
                                "attention_weights": forecast.get("attention_weights", {}),
                                "pour_schedule": schedule,
                                "vibration_g": state["vibration_g"],
                            }
                            pouring_state = await pouring_twin.receive_upstream_warning(warning, molding_twin.get_state())
                            if pouring_state.get("pre_pour_risk", 0) > 0.7:
                                alert_store.record_threshold(
                                    twin="pouring",
                                    batch_id=pouring_state["batch_id"],
                                    severity="critical",
                                    event_time=now_str,
                                    event_key=f"pouring-risk:{pouring_state['batch_id']}:{now_str}",
                                    message=f"Cross-stage defect risk reached {pouring_state['pre_pour_risk']:.2f} after the melting warning.",
                                )
                            await ws_manager.broadcast_digital_twin_update(pouring_state["batch_id"], pouring_state, twin="pouring")
                elif "molding" in ds_name:
                    state = await molding_twin.process_row(row, now_str)
                    events = DatasetMapper.map_molding_row(row, now_str)
                    topic = "foundry/sensors/molding"
                    await self._publish_events(topic, events)
                    await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="molding")
                elif "inspection" in ds_name:
                    inspection = DatasetMapper.map_inspection_row(row, now_str)
                    prediction = resnet_classifier.classify_image(inspection)
                    inspection.update({"predicted_defect": prediction["predicted_defect"], "confidence": prediction["confidence"]})
                    state = await quality_twin.process_event(inspection)
                    await self._publish_events("foundry/inspections", [inspection])
                    await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="quality")
                elif "env" in ds_name:
                    events = DatasetMapper.map_env_row(row, now_str)
                    topic = "foundry/sensors/environmental"
                    await self._publish_events(topic, events)

                global_simulator_state.records_published += len(events) or 1

                global_simulator_state.current_row += 1
                global_simulator_state.progress_percentage = round((global_simulator_state.current_row / total_rows) * 100, 2)

                source_delta = (source_time - previous_source_time).total_seconds() if previous_source_time else 2.0
                previous_source_time = source_time
                base_delay = max(0.01, source_delta) / max(0.1, global_simulator_state.replay_speed)
                await asyncio.sleep(base_delay)

            global_simulator_state.is_running = False
            logger.info("SensorSimulator completed replay stream")
            
        except Exception as e:
            logger.error(f"Error in SensorSimulator execution loop: {e}", exc_info=True)
            global_simulator_state.is_running = False

    async def _publish_events(self, topic: str, events: list[dict]) -> None:
        if events:
            await asyncio.gather(*(mqtt_publisher.publish(topic, event) for event in events))

sensor_simulator = SensorSimulator()
