import asyncio
import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import OperationalError
from app.core.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

def make_request(correlation_id="corr-test-123"):
    request = MagicMock()
    request.method = "GET"
    request.url.path = "/api/v1/test"
    request.state.correlation_id = correlation_id
    return request

def test_http_exception_handler_standard():
    request = make_request("req-abc-123")
    exc = HTTPException(status_code=404, detail="Resource not found")
    
    response = asyncio.run(http_exception_handler(request, exc))
    assert response.status_code == 404
    assert response.headers.get("x-correlation-id") == "req-abc-123"

def test_http_exception_handler_with_custom_code():
    request = make_request("req-code-456")
    exc = HTTPException(status_code=403, detail="Unverified company")
    setattr(exc, "error_code", "COMPANY_NOT_VERIFIED")

    response = asyncio.run(http_exception_handler(request, exc))
    assert response.status_code == 403

def test_validation_exception_handler():
    request = make_request("req-val-789")
    exc = RequestValidationError(errors=[{"loc": ("body", "email"), "msg": "Invalid email", "type": "value_error"}])

    response = asyncio.run(validation_exception_handler(request, exc))
    assert response.status_code == 422
    assert response.headers.get("x-correlation-id") == "req-val-789"

def test_generic_exception_handler_database_error():
    request = make_request("req-db-fail")
    db_exc = OperationalError("SELECT 1", {}, Exception("Connection refused"))

    response = asyncio.run(generic_exception_handler(request, db_exc))
    assert response.status_code == 503
    assert response.headers.get("x-correlation-id") == "req-db-fail"

def test_generic_exception_handler_unhandled():
    request = make_request("req-panic")
    exc = RuntimeError("Unexpected internal crash")

    response = asyncio.run(generic_exception_handler(request, exc))
    assert response.status_code == 500
    assert response.headers.get("x-correlation-id") == "req-panic"
