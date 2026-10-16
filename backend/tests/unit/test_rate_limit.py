import time
import asyncio
import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from app.core.rate_limit import SlidingWindowRateLimiter

def make_mock_request(client_ip="127.0.0.1", forwarded_for=None):
    request = MagicMock()
    request.client.host = client_ip
    headers = {}
    if forwarded_for:
        headers["x-forwarded-for"] = forwarded_for
    request.headers.get.side_effect = lambda k, default=None: headers.get(k.lower(), default)
    return request

def test_rate_limiter_allows_requests_under_threshold():
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=10)
    req = make_mock_request("192.168.1.1")

    # 3 requests should pass without error
    asyncio.run(limiter(req))
    asyncio.run(limiter(req))
    asyncio.run(limiter(req))

def test_rate_limiter_blocks_requests_over_threshold():
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=10)
    req = make_mock_request("192.168.1.2")

    asyncio.run(limiter(req))
    asyncio.run(limiter(req))

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(limiter(req))

    assert exc_info.value.status_code == 429
    assert "Too many requests" in exc_info.value.detail
    assert exc_info.value.headers is not None and "Retry-After" in exc_info.value.headers

def test_rate_limiter_window_slide_allows_subsequent_requests(monkeypatch):
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=10)
    req = make_mock_request("192.168.1.3")

    fake_now = [1000.0]
    monkeypatch.setattr(time, "time", lambda: fake_now[0])

    asyncio.run(limiter(req))
    asyncio.run(limiter(req))

    # 3rd request at same time fails
    with pytest.raises(HTTPException):
        asyncio.run(limiter(req))

    # Advance time past the 10-second window
    fake_now[0] += 11.0

    # Request should now succeed
    asyncio.run(limiter(req))

def test_rate_limiter_extracts_client_ip_from_x_forwarded_for():
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=10)
    req = make_mock_request("10.0.0.1", forwarded_for="203.0.113.195, 70.41.3.18, 150.172.238.178")

    ip = limiter._get_client_ip(req)
    assert ip == "203.0.113.195"

def test_rate_limiter_isolates_different_ips():
    limiter = SlidingWindowRateLimiter(max_requests=1, window_seconds=10)
    req1 = make_mock_request("1.1.1.1")
    req2 = make_mock_request("2.2.2.2")

    asyncio.run(limiter(req1))
    # req1 is exhausted
    with pytest.raises(HTTPException):
        asyncio.run(limiter(req1))

    # req2 from different IP should succeed
    asyncio.run(limiter(req2))

def test_rate_limiter_cleanup_stale_entries():
    limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
    limiter._history["old_ip"] = [100.0, 105.0]
    limiter._last_cleanup = 0.0

    # Trigger cleanup after >300 seconds
    limiter._cleanup_stale_entries(now=500.0)

    # old_ip timestamps are well before cutoff (500 - 60 = 440)
    assert "old_ip" not in limiter._history
