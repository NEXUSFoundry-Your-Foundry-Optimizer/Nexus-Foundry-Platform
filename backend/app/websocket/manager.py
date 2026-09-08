import json
import logging
from collections import defaultdict, deque
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("WebSocketManager")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.batch_connections: Dict[str, List[WebSocket]] = {}
        self.twin_history: Dict[str, deque[Dict[str, Any]]] = defaultdict(lambda: deque(maxlen=60))

    async def connect(self, websocket: WebSocket, batch_id: str = "all"):
        await websocket.accept()
        self.active_connections.append(websocket)
        if batch_id not in self.batch_connections:
            self.batch_connections[batch_id] = []
        self.batch_connections[batch_id].append(websocket)
        logger.info(f"WebSocket connected for batch {batch_id}")

    def disconnect(self, websocket: WebSocket, batch_id: str = "all"):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if batch_id in self.batch_connections and websocket in self.batch_connections[batch_id]:
            self.batch_connections[batch_id].remove(websocket)
        logger.info(f"WebSocket disconnected from batch {batch_id}")

    async def broadcast_digital_twin_update(self, batch_id: str, state: Dict[str, Any], twin: str = "unknown"):
        self.twin_history[twin].append({"batch_id": batch_id, **state})
        payload = {
            "type": "digital_twin_update",
            "twin": twin,
            "batch_id": batch_id,
            "timestamp": state.get("updated_at"),
            "state": state
        }
        json_data = json.dumps(payload)
        
        # Broadcast to all connections
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json_data)
            except Exception as e:
                logger.error(f"Error sending WebSocket broadcast: {e}")

    def get_twin_history(self, twin: str) -> List[Dict[str, Any]]:
        return list(self.twin_history.get(twin, ()))

ws_manager = ConnectionManager()
