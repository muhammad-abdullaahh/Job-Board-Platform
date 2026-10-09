# In-Memory Cache Utility
# Provides thread-safe in-memory caching with time-to-live (TTL) expiration.
# Speeds up frequently accessed read endpoints and supports prefix-based cache invalidation.

import time
import threading
from typing import Any, Optional, Dict

class SimpleInMemoryCache:
    """
    Lightweight, thread-safe in-memory cache with TTL and prefix invalidation.
    Ideal for speeding up remote cloud database queries (e.g. Supabase) on public read endpoints.
    """
    def __init__(self, default_ttl: int = 60, max_entries: int = 2000):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl
        self.max_entries = max_entries

    def _purge_expired_locked(self, now: float) -> None:
        expired_keys = [k for k, entry in self._cache.items() if now > entry["expires_at"]]
        for k in expired_keys:
            del self._cache[k]

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            if time.time() > entry["expires_at"]:
                del self._cache[key]
                return None
            return entry["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl if ttl is not None else self.default_ttl
        now = time.time()
        with self._lock:
            # Capacity guard: evict expired items when reaching threshold
            if len(self._cache) >= self.max_entries:
                self._purge_expired_locked(now)
                # If still over limit, drop oldest items
                if len(self._cache) >= self.max_entries:
                    excess = len(self._cache) - self.max_entries + 100
                    keys_to_drop = list(self._cache.keys())[:excess]
                    for k in keys_to_drop:
                        del self._cache[k]

            self._cache[key] = {
                "value": value,
                "expires_at": now + ttl
            }

    def delete(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)

    def clear_prefix(self, prefix: str) -> int:
        """Invalidate all cache keys starting with the given prefix."""
        with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
            for k in keys_to_delete:
                del self._cache[k]
            return len(keys_to_delete)

    def clear_all(self) -> None:
        with self._lock:
            self._cache.clear()

# Global singleton cache instances
api_cache = SimpleInMemoryCache(default_ttl=60)
