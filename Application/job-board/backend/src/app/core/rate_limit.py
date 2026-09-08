import time
import threading
from typing import Dict, List
from fastapi import Request, HTTPException, status

class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding-window rate limiter for FastAPI endpoints.
    Protects authentication endpoints against credential stuffing, brute force, and spam.
    """
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: Dict[str, List[float]] = {}
        self._lock = threading.Lock()
        self._last_cleanup = time.time()

    def _cleanup_stale_entries(self, now: float):
        if now - self._last_cleanup > 300:  # Cleanup every 5 minutes
            cutoff = now - self.window_seconds
            empty_keys = []
            for ip, timestamps in self._history.items():
                self._history[ip] = [t for t in timestamps if t > cutoff]
                if not self._history[ip]:
                    empty_keys.append(ip)
            for k in empty_keys:
                del self._history[k]
            self._last_cleanup = now

    def _get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # First IP in X-Forwarded-For is the originating client
            return forwarded_for.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "127.0.0.1"

    async def __call__(self, request: Request):
        ip = self._get_client_ip(request)
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            self._cleanup_stale_entries(now)
            timestamps = self._history.get(ip, [])
            # Filter timestamps within current sliding window
            valid_timestamps = [t for t in timestamps if t > window_start]

            if len(valid_timestamps) >= self.max_requests:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(oldest + self.window_seconds - now))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please slow down and try again later.",
                    headers={"Retry-After": str(retry_after)}
                )

            valid_timestamps.append(now)
            self._history[ip] = valid_timestamps

# Pre-configured rate limiters for auth endpoints
login_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)
forgot_password_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
register_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
