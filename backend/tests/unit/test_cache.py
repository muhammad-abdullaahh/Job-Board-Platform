import time
import pytest
from app.utils.cache import SimpleInMemoryCache

def test_cache_set_and_get():
    cache = SimpleInMemoryCache(default_ttl=10)
    cache.set("user:1", {"name": "Alice"})
    assert cache.get("user:1") == {"name": "Alice"}
    assert cache.get("nonexistent") is None

def test_cache_ttl_expiration(monkeypatch):
    cache = SimpleInMemoryCache(default_ttl=5)
    current_time = [100.0]
    monkeypatch.setattr(time, "time", lambda: current_time[0])

    cache.set("temp_key", "temp_value", ttl=5)
    assert cache.get("temp_key") == "temp_value"

    # Advance time beyond TTL
    current_time[0] += 6.0
    assert cache.get("temp_key") is None

def test_cache_delete():
    cache = SimpleInMemoryCache()
    cache.set("key1", "val1")
    assert cache.get("key1") == "val1"

    cache.delete("key1")
    assert cache.get("key1") is None
    # Deleting non-existent key shouldn't raise
    cache.delete("key1")

def test_cache_clear_prefix():
    cache = SimpleInMemoryCache()
    cache.set("jobs:1", {"title": "Dev"})
    cache.set("jobs:2", {"title": "Design"})
    cache.set("users:1", {"name": "Bob"})

    deleted_count = cache.clear_prefix("jobs:")
    assert deleted_count == 2
    assert cache.get("jobs:1") is None
    assert cache.get("jobs:2") is None
    assert cache.get("users:1") == {"name": "Bob"}

def test_cache_clear_all():
    cache = SimpleInMemoryCache()
    cache.set("k1", 1)
    cache.set("k2", 2)
    cache.clear_all()
    assert cache.get("k1") is None
    assert cache.get("k2") is None

def test_cache_capacity_eviction():
    cache = SimpleInMemoryCache(default_ttl=60, max_entries=5)
    for i in range(10):
        cache.set(f"item:{i}", i)

    # Cache should not exceed max_entries
    assert len(cache._cache) <= 5
