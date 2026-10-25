import asyncio
from datetime import datetime
import logging
from typing import Optional, List, Any

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

def parse_source_time(val: Any) -> datetime:
    if not val:
        return datetime.now()
    val_str = str(val).strip()
    try:
        return datetime.fromisoformat(val_str)
    except ValueError:
        pass
    for fmt in ("%d-%m-%Y %H:%M", "%d-%m-%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M:%S"):
        try:
            return datetime.strptime(val_str, fmt)
        except ValueError:
            pass
    return datetime.now()

class SensorSimulator:
    """
    Multi-Rate Sensor Simulator supporting independent parallel streams:
    - Furnace Stream: 2.0s interval
    - Molding Stream: 30.0s interval
    - Pouring Stream: 0.5s interval
    - Quality Stream: 4.0s interval
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
        global_simulator_state.total_rows = 25000
        
        # Reset digital twins states for fresh replay
        melting_twin.sensor_history.clear()
        lstm_autoencoder.reset_calibration()
        pouring_twin.current_state["upstream_anomaly"] = False

        # Launch independent parallel loops for Furnace (2s), Molding (30s), Pouring (0.5s), Quality (4s)
        self._tasks = [
            asyncio.create_task(self._run_furnace_loop()),
            asyncio.create_task(self._run_molding_loop()),
            asyncio.create_task(self._run_pouring_loop()),
            asyncio.create_task(self._run_quality_loop()),
        ]
        logger.info(f"Started Multi-Rate SensorSimulator (Furnace@2s, Molding@30s, Pouring@0.5s, Quality@4s) at {speed}x speed")

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
        while global_simulator_state.is_running:
            try:
                dataset_name = global_simulator_state.current_dataset
                batch_id = global_simulator_state.current_batch_id
                global_simulator_state.total_rows = 25000

                for row in dataset_loader.iter_rows(dataset_name, batch_id=batch_id):
                    if not global_simulator_state.is_running:
                        break
                    if global_simulator_state.is_paused:
                        await asyncio.sleep(0.25)
                        continue

                    source_value = row.get("timestamp")
                    source_time = parse_source_time(source_value)
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
                        state["workflow_id"] = workflow["workflow_id"]
                        await redis_manager.set_digital_twin_state("melting", state["batch_id"], state)
                        await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="melting")

                    global_simulator_state.records_published += 1
                    global_simulator_state.current_row += 1
                    global_simulator_state.progress_percentage = round((global_simulator_state.current_row / max(1, global_simulator_state.total_rows)) * 100, 2)
                    await asyncio.sleep(2.0 / max(0.1, global_simulator_state.replay_speed))

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception("Error in furnace stream loop: %s", e)
                await asyncio.sleep(2.0)

    async def _run_molding_loop(self):
        """Molding telemetry stream at 30.0s interval."""
        while global_simulator_state.is_running:
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
                break
            except Exception as e:
                logger.exception("Error in molding stream loop: %s", e)
                await asyncio.sleep(2.0)

    async def _run_pouring_loop(self):
        """Pouring telemetry stream at 0.5s interval."""
        while global_simulator_state.is_running:
            try:
                for row in dataset_loader.iter_rows("pouring_sensor.csv"):
                    if not global_simulator_state.is_running:
                        break
                    now_str = datetime.now().isoformat()
                    state = await pouring_twin.process_event(row)
                    await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="pouring")
                    await asyncio.sleep(0.5 / max(0.1, global_simulator_state.replay_speed))
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception("Error in pouring stream loop: %s", e)
                await asyncio.sleep(1.0)

    async def _run_quality_loop(self):
        """Visual inspection station at 4.0s interval.

        Closes the four-stage pipeline: each inspection cycles a casting off the
        line and classifies it with the ResNet-50 visual model. The batch is
        inherited from the live pouring stream so risk flows melt -> mold ->
        pour -> inspection without any manual trigger.
        """
        while global_simulator_state.is_running:
            try:
                if global_simulator_state.is_paused:
                    await asyncio.sleep(0.5)
                    continue

                pouring_state = pouring_twin.get_state()
                upstream_risk = float(pouring_state.get("pre_pour_risk") or 0.0)
                now_str = pouring_state.get("updated_at") or datetime.now().isoformat()

                melting_state = melting_twin.get_state()
                molding_state = molding_twin.get_state()
                moisture = float(molding_state.get("sand_moisture") or 0.0)
                humectant_risk = max(0.0, (moisture - 4.5) / 5.5)  # >4.5% moisture raises gas porosity risk
                defect_probability = min(1.0, 0.85 * upstream_risk + 0.15 * humectant_risk)
                defect_present = defect_probability > 0.35
                event = {
                    "batch_id": pouring_state.get("batch_id", "BATCH-DEFAULT"),
                    "image_id": f"IMG-{pouring_state.get('batch_id', 'B')}-{now_str[-8:]}",
                    "melt_temp": melting_state.get("melt_temp", 1380.0),
                    "pre_pour_risk": upstream_risk,
                    "sand_moisture": moisture,
                }
                if defect_present:
                    defect_type = ("porosity" if moisture > 4.5 else "shrinkage") if upstream_risk > 0.5 else "sand_inclusion"
                else:
                    defect_type = "none"
                event["defect_type"] = defect_type
                event["severity"] = 3 if defect_probability > 0.7 else (1 if defect_present else 0)
                classified = await asyncio.to_thread(resnet_classifier.classify_image, event)

                event["defect_present"] = bool(defect_present)
                event["inspection_result"] = classified.get("inspection_result", "PASS")
                defect_probability_out = float(classified.get("confidence", 0.98)) if defect_present else round(defect_probability, 3)
                event["defect_risk"] = defect_probability_out
                event["quality_score"] = round(max(0.0, 1.0 - defect_probability), 3)

                state = await quality_twin.process_event(event)
                await self._publish_events("foundry/sensors/quality", [event])
                await ws_manager.broadcast_digital_twin_update(state["batch_id"], state, twin="quality")
                if defect_present:
                    alert_store.record_threshold(
                        twin="quality",
                        batch_id=str(state["batch_id"]),
                        severity="critical" if defect_probability > 0.7 else "warning",
                        event_time=now_str,
                        event_key=f"quality:{state['batch_id']}:{now_str}",
                        message=(
                            f"Visual inspection flagged {defect_type or 'surface defect'} on casting "
                            f"{state['batch_id']} (confidence {defect_probability_out*100:.1f}%)."
                        ),
                    )
                await asyncio.sleep(4.0 / max(0.1, global_simulator_state.replay_speed))

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception("Error in quality stream loop: %s", e)
                await asyncio.sleep(2.0)

    async def _publish_events(self, topic: str, events: list[dict]) -> None:
        if events:
            try:
                await asyncio.gather(*(mqtt_publisher.publish(topic, event) for event in events))
            except Exception:
                pass

sensor_simulator = SensorSimulator()
