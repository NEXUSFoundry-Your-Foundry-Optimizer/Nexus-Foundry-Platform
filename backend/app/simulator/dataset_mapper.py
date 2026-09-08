from typing import Dict, Any, List
from datetime import datetime

class DatasetMapper:
    """
    Maps historical raw dataset schema into standardized MQTT simulated sensor payloads.
    """
    
    # Furnace dataset fields mapping
    FURNACE_MAPPING = {
        "melt_temp": {"unit": "C", "sensor_prefix": "TEMP_FURNACE"},
        "power_kw": {"unit": "kW", "sensor_prefix": "POWER_FURNACE"},
        "vibration_g": {"unit": "g", "sensor_prefix": "VIB_FURNACE"},
        "lining_health_index": {"unit": "pct", "sensor_prefix": "LINING_HEALTH"},
        "cooling_water_inlet_temp": {"unit": "C", "sensor_prefix": "TEMP_COOL_IN"},
        "cooling_water_outlet_temp": {"unit": "C", "sensor_prefix": "TEMP_COOL_OUT"}
    }
    
    # Molding dataset fields mapping
    MOLDING_MAPPING = {
        "sand_moisture": {"unit": "pct", "sensor_prefix": "SAND_MOIST"},
        "permeability": {"unit": "cm/min", "sensor_prefix": "PERMEABILITY"},
        "green_strength": {"unit": "kPa", "sensor_prefix": "GREEN_STRENGTH"},
        "compactability": {"unit": "pct", "sensor_prefix": "COMPACTABILITY"}
    }
    
    # Environmental dataset fields mapping
    ENV_MAPPING = {
        "ambient_temp": {"unit": "C", "sensor_prefix": "ENV_TEMP"},
        "ambient_humidity": {"unit": "pct", "sensor_prefix": "ENV_HUMIDITY"}
    }

    @staticmethod
    def map_furnace_row(row: Dict[str, Any], sim_time: str) -> List[Dict[str, Any]]:
        batch_id = str(row.get("batch_id", "BATCH-DEFAULT"))
        furnace_id = str(row.get("furnace_id", "FURNACE_1"))
        op_state = str(row.get("operating_state", "Melting"))
        
        events = []
        for field, meta in DatasetMapper.FURNACE_MAPPING.items():
            if field in row and not pd.isna(row[field]):
                events.append({
                    "sensor_id": f"{meta['sensor_prefix']}_{furnace_id}",
                    "batch_id": batch_id,
                    "equipment_id": furnace_id,
                    "timestamp": sim_time,
                    "measurement_type": field,
                    "value": float(row[field]),
                    "unit": meta["unit"],
                    "operating_state": op_state
                })
        return events

    @staticmethod
    def map_molding_row(row: Dict[str, Any], sim_time: str) -> List[Dict[str, Any]]:
        batch_id = str(row.get("batch_id", "BATCH-DEFAULT"))
        machine_id = str(row.get("molding_machine_id", "MOLDING_LINE_1"))
        mold_id = str(row.get("mold_id", "MOLD-0001"))
        
        events = []
        for field, meta in DatasetMapper.MOLDING_MAPPING.items():
            if field in row and not pd.isna(row[field]):
                events.append({
                    "sensor_id": f"{meta['sensor_prefix']}_{machine_id}",
                    "batch_id": batch_id,
                    "equipment_id": machine_id,
                    "mold_id": mold_id,
                    "timestamp": sim_time,
                    "measurement_type": field,
                    "value": float(row[field]),
                    "unit": meta["unit"]
                })
        return events

    @staticmethod
    def map_env_row(row: Dict[str, Any], sim_time: str) -> List[Dict[str, Any]]:
        events = []
        for field, meta in DatasetMapper.ENV_MAPPING.items():
            if field in row and not pd.isna(row[field]):
                events.append({
                    "sensor_id": f"{meta['sensor_prefix']}_PLANT",
                    "equipment_id": "PLANT_ENVIRONMENT",
                    "timestamp": sim_time,
                    "measurement_type": field,
                    "value": float(row[field]),
                    "unit": meta["unit"]
                })
        return events

    @staticmethod
    def map_inspection_row(row: Dict[str, Any], sim_time: str) -> Dict[str, Any]:
        return {
            "batch_id": str(row.get("batch_id", "BATCH-DEFAULT")),
            "image_id": str(row.get("image_id", "UNKNOWN")),
            "defect_present": str(row.get("defect_present", "False")).lower() == "true",
            "defect_type": str(row.get("defect_type", "none")),
            "severity": int(row.get("severity", 0)),
            "inspection_result": str(row.get("inspection_result", "PASS")),
            "timestamp": sim_time,
        }

import pandas as pd
