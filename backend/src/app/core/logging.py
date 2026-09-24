# Structured JSON Logging
# Formats application access logs and error logs into clean, single-line JSON records.
# Enables centralized log tracking with correlation IDs and execution timing.

import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

# Create logger dedicated to access logs
access_logger = logging.getLogger("app.access")
access_logger.setLevel(logging.INFO)

# Handler for stdout
if not access_logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(message)s"))
    access_logger.addHandler(handler)
    access_logger.propagate = False

def log_request(
    correlation_id: str,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    client_ip: Optional[str] = None
) -> None:
    """Log structured JSON access record for every HTTP request."""
    entry: Dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "correlation_id": correlation_id,
        "method": method,
        "path": path,
        "status_code": status_code,
        "response_time_ms": round(duration_ms, 2),
    }
    if client_ip:
        entry["client_ip"] = client_ip
    access_logger.info(json.dumps(entry))

def log_error(
    correlation_id: Optional[str],
    method: str,
    path: str,
    status_code: int,
    error_code: str,
    exception_type: str,
    stack_trace: Optional[str] = None
) -> None:
    """Log structured JSON error record for failed requests / unhandled exceptions."""
    entry: Dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "correlation_id": correlation_id or "unknown",
        "method": method,
        "path": path,
        "status_code": status_code,
        "error_code": error_code,
        "exception_type": exception_type,
    }
    if stack_trace:
        entry["stack_trace"] = stack_trace
    access_logger.error(json.dumps(entry))
