import asyncio
from datetime import datetime
import logging
from typing import Optional, List

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
from backend.app.ml.lstm_autoencoder import lstm_autoencoder
from backend.app.db.influxdb import influx_manager
from backend.app.alerts import alert_store
from backend.app.workflows import workflow_store
from backend.app.db.redis import redis_manager

logger = logging.getLogger("SensorSimulator")

class SensorSimulator:
    """
    Multi-Rate Sensor Simulator supporting independent parallel streams:
    - Furnace Stream: 2.0s interval
    - Molding Stream: 30.0s interval
    - Pouring Stream: 0.5s interval
    """
    def __init__(self):
        self._tasks: List[asyncio.Task] = []

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
        
        # Reset digital twins states for fresh replay
        melting_twin.sensor_history.clear()
        lstm_autoencoder.reset_calibration()
        pouring_twin.current_state["upstream_anomaly"] = False

        # Launch independent parallel loops for Furnace (2s), Molding (30s), and Pouring (0.5s)
        self._tasks = [
            asyncio.create_task(self._run_furnace_loop()),
            asyncio.create_task(self._run_molding_loop()),
            asyncio.create_task(self._run_pouring_loop())
        ]
        logger.info(f"Started Multi-Rate SensorSimulator (Furnace@2s, Molding@30s, Pouring@0.5s) at {speed}x speed")

    async def pause(self):
        global_simulator_state.is_paused = True
        logger.info("SensorSimulator paused")

    async def resume(self):
        global_simulator_state.is_paused = False
        logger.info("SensorSimulator resumed")

    async def stop(self):
        global_simulator_state.is_running = False
        global_simulator_state.is_paused = False
        for t in self._tasks:
            if not t.done():
                t.cancel()
        self._tasks = []
        logger.info("SensorSimulator stopped")

    async def _run_furnace_loop(self):
        """Furnace telemetry stream at 2.0s interval."""
        try:
            dataset_name = global_simulator_state.current_dataset
            batch_id = global_simulator_state.current_batch_id
            # Do not scan the very large furnace CSV before emitting its first row.
            # A live stream must start immediately; total_rows remains unknown (0).
            total_rows = 0
            global_simulator_state.total_rows = 0

            for row in dataset_loader.iter_rows(dataset_name, batch_id=batch_id):
                if not global_simulator_state.is_running:
                    break
                if global_simulator_state.is_paused:
                    await asyncio.sleep(0.25)
                    continue

                source_value = row.get("timestamp")
                try:
                    source_time = datetime.fromisoformat(str(source_value)) if source_value else datetime.now()
                except ValueError:
                    source_time = datetime.now()
                now_str = source_time.isoformat()
                global_simulator_state.simulated_timestamp = now_str

                state = await melting_twin.process_row(row, now_str, dataset_name=dataset_name)
                events = DatasetMapper.map_furnace_row(row, now_str)
                await self._publish_events("foundry/sensors/furnace", events)
                await influx_manager.write_sensor_measurement("furnace", {"batch_id": state["batch_id"], "furnace_id": state["furnace_id"]}, {key: float(value) for key, value in row.items() if key in {"melt_temp", "power_kw", "vibration_g", "lining_health_index"}})
                await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="melting")

                if state.get("anomaly_transition"):
                    anomaly_alert = alert_store.record_threshold(
                        twin="melting",
                        batch_id=state["batch_id"],
                        severity="critical",
                        event_time=now_str,
                        event_key=f"melting-anomaly:{state['batch_id']}:{now_str}",
                        message=f"LSTM-AE anomaly detected: score {state['anomaly_score']:.2f} exceeded threshold 0.78.",
                    )
                    detection = state.get("anomaly_detection", {})
                    forecast = state.get("forecast", {})
                    schedule = melting_twin.get_next_pour_schedule(state["batch_id"], source_time)
                    warning = None
                    pouring_state = None
                    risk_alert = None
                    # A warning must contain an actual TFT result.  Do not
                    # substitute the current temperature when the trained
                    # forecast artifact is unavailable; that would make the
                    # downstream XGBoost/SHAP result appear model-backed when
                    # it is not.
                    if schedule is not None and forecast.get("status") == "completed":
                        warning = {
                            "batch_id": state["batch_id"],
                            "timestamp": now_str,
                            "severity": state["anomaly_score"],
                            "anomaly_score": state["anomaly_score"],
                            "projected_temp": forecast.get("forecast_9pm_temperature"),
                            "lining_health": state["lining_health"],
                            "failure_time": forecast.get("failure_time"),
                            "attention_weights": forecast.get("attention_weights", {}),
                            "pour_schedule": schedule,
                            "vibration_g": state["vibration_g"],
                            "power_kw": state["power_kw"],
                        }
                        pouring_state = await pouring_twin.receive_upstream_warning(warning, molding_twin.get_state())
                        defect_probability = float(pouring_state.get("pre_pour_risk") or 0.0)
                        risk_alert = alert_store.record_threshold(
                            twin="pouring",
                            batch_id=pouring_state["batch_id"],
                            severity="critical" if defect_probability > 0.7 else "warning",
                            event_time=now_str,
                            event_key=f"pouring-risk-assessment:{pouring_state['batch_id']}:{now_str}",
                            message=(
                                f"Cross-stage defect risk is {defect_probability:.2%} after the melting warning."
                                if defect_probability > 0.7
                                else f"Cross-stage defect assessment completed at {defect_probability:.2%}; furnace emergency remains active."
                            ),
                        )
                        await ws_manager.broadcast_digital_twin_update(pouring_state["batch_id"], pouring_state, twin="pouring")

                    workflow = await workflow_store.record_cascade(
                        melting_state=state,
                        detection=detection,
                        tft_context=state.get("emergency_tft_context", {}),
                        schedule=schedule,
                        warning=warning,
                        pouring_state=pouring_state,
                        anomaly_alert=anomaly_alert,
                        risk_alert=risk_alert,
                    )
                    # Make the audit identifier visible in the melting state as
                    # soon as the cascade is persisted, then broadcast it with
                    # the normal live stream.
                    state["workflow_id"] = workflow["workflow_id"]
                    await redis_manager.set_digital_twin_state("melting", state["batch_id"], state)
                    await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="melting")

                global_simulator_state.records_published += 1
                global_simulator_state.current_row += 1
                global_simulator_state.progress_percentage = 0.0 if total_rows == 0 else round((global_simulator_state.current_row / total_rows) * 100, 2)
                await asyncio.sleep(2.0 / max(0.1, global_simulator_state.replay_speed))

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in furnace stream loop: {e}")

    async def _run_molding_loop(self):
        """Molding telemetry stream at 30.0s interval."""
        try:
            for row in dataset_loader.iter_rows("molding_sensor.csv"):
                if not global_simulator_state.is_running:
                    break
                now_str = datetime.now().isoformat()
                state = await molding_twin.process_row(row, now_str)
                events = DatasetMapper.map_molding_row(row, now_str)
                await self._publish_events("foundry/sensors/molding", events)
                await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="molding")
                await asyncio.sleep(30.0 / max(0.1, global_simulator_state.replay_speed))
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in molding stream loop: {e}")

    async def _run_pouring_loop(self):
        """Pouring telemetry stream at 0.5s interval."""
        try:
            for row in dataset_loader.iter_rows("pouring_sensor.csv"):
                if not global_simulator_state.is_running:
                    break
                now_str = datetime.now().isoformat()
                state = await pouring_twin.process_event(row)
                await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="pouring")
                await asyncio.sleep(0.5 / max(0.1, global_simulator_state.replay_speed))
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in pouring stream loop: {e}")

    async def _publish_events(self, topic: str, events: list[dict]) -> None:
        if events:
            await asyncio.gather(*(mqtt_publisher.publish(topic, event) for event in events))

sensor_simulator = SensorSimulator()
