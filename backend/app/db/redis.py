import json
import logging
from typing import Optional, Any, Callable
import redis.asyncio as redis
from backend.app.config import settings

logger = logging.getLogger("RedisClient")

class RedisManager:
    def __init__(self):
        self.redis: redis.Redis = None
        self.connected = False
        self._memory_cache = {} # Fallback in-memory dict

    async def connect(self):
        try:
            self.redis = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True
            )
            await self.redis.ping()
            self.connected = True
            logger.info(f"Connected to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except Exception as e:
            logger.warning(f"Redis connection failed ({e}). Operating in memory cache mode.")
            self.connected = False

    async def get(self, key: str) -> Optional[Any]:
        if self.connected and self.redis:
            try:
                val = await self.redis.get(key)
                return json.loads(val) if val else None
            except Exception:
                pass
        val = self._memory_cache.get(key)
        return json.loads(val) if val else None

    async def set(self, key: str, value: Any, ttl: Optional[int] = 3600):
        val_str = json.dumps(value)
        if self.connected and self.redis:
            try:
                if ttl:
                    await self.redis.setex(key, ttl, val_str)
                else:
                    await self.redis.set(key, val_str)
            except Exception:
                pass
        self._memory_cache[key] = val_str

    async def delete(self, key: str):
        if self.connected and self.redis:
            try:
                await self.redis.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)

    async def invalidate(self, pattern: str):
        if self.connected and self.redis:
            try:
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
            except Exception:
                pass
        to_del = [k for k in self._memory_cache if pattern.replace('*', '') in k]
        for k in to_del:
            self._memory_cache.pop(k, None)

    async def get_or_set(self, key: str, fetch_fn: Callable, ttl: int = 300) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached
        val = await fetch_fn()
        await self.set(key, val, ttl=ttl)
        return val

    # Helper methods for Digital Twin & Sensor state keys
    async def set_sensor_latest(self, sensor_id: str, payload: dict):
        await self.set(f"sensor:latest:{sensor_id}", payload, ttl=86400)

    async def set_digital_twin_state(self, twin_type: str, batch_id: str, state: dict):
        await self.set(f"digital_twin:{twin_type}:{batch_id}", state, ttl=86400)
        await self.set(f"digital_twin:{twin_type}:latest", state, ttl=86400)

    async def get_digital_twin_state(self, twin_type: str, batch_id: str = "latest") -> Optional[dict]:
        return await self.get(f"digital_twin:{twin_type}:{batch_id}")

redis_manager = RedisManager()
