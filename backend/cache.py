"""Simple in-memory TTL cache for analysis results."""

import asyncio
import time
import uuid
from typing import Any


class TTLCache:
    """Thread-safe in-memory cache with TTL expiration."""

    def __init__(self, ttl_seconds: int = 900, cleanup_interval: int = 300):
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()
        self._cleanup_task: asyncio.Task | None = None
        self._cleanup_interval = cleanup_interval

    async def start_cleanup(self):
        """Start periodic cleanup of expired entries."""
        async def _cleanup():
            while True:
                await asyncio.sleep(self._cleanup_interval)
                async with self._lock:
                    now = time.time()
                    expired = [
                        k for k, (exp, _) in self._store.items() if now > exp
                    ]
                    for k in expired:
                        del self._store[k]
        self._cleanup_task = asyncio.create_task(_cleanup())

    async def stop_cleanup(self):
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

    async def set(self, key: str, value: Any) -> str:
        async with self._lock:
            self._store[key] = (time.time() + self._ttl, value)
        return key

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expiry, value = entry
            if time.time() > expiry:
                del self._store[key]
                return None
            return value


# Global singleton
result_cache = TTLCache(ttl_seconds=900)  # 15 minutes
