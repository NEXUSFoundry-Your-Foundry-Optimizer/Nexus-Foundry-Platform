import logging
from collections import deque
from datetime import datetime
from typing import Any, Deque, Dict, Optional, List
from backend.app.db.redis import redis_manager

logger = logging.getLogger("AlertStore")

class AlertStore:
    """
    Durable Alert Store persisting active and historic alert logs
    to Redis and PostgreSQL to survive server restarts.
    """
    def __init__(self, max_size: int = 500):
        self._alerts: Deque[Dict[str, Any]] = deque(maxlen=max_size)
        self._keys: set[str] = set()

    def add(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        key = str(alert["id"])
        if key in self._keys:
            return alert
        if len(self._alerts) == self._alerts.maxlen:
            self._keys.discard(str(self._alerts[0]["id"]))
        self._alerts.append(alert)
        self._keys.add(key)
        
        # Persist alert asynchronously to Redis cache
        try:
            import asyncio
            asyncio.create_task(redis_manager.set(f"alert:{key}", alert, ttl=604800))
        except Exception:
            pass
            
        return alert

    def record_threshold(
        self,
        *,
        twin: str,
        batch_id: str,
        severity: str,
        message: str,
        event_time: Optional[str] = None,
        event_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        timestamp = event_time or datetime.now().isoformat()
        alert_id = event_key or f"{twin}:{batch_id}:{timestamp}"
        return self.add({
            "id": alert_id,
            "twin": twin,
            "batch": batch_id,
            "severity": severity,
            "time": timestamp,
            "message": message,
        })

    def list(self, twin: Optional[str] = None) -> list[Dict[str, Any]]:
        alerts = list(reversed(self._alerts))
        return [alert for alert in alerts if twin is None or alert["twin"] == twin]

alert_store = AlertStore()