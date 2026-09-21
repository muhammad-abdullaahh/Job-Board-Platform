import traceback
from fastapi import Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.core.logging import log_error

STATUS_CODE_TO_ERROR_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    500: "INTERNAL_SERVER_ERROR",
    503: "SERVICE_UNAVAILABLE",
}

async def http_exception_handler(request: Request, exc: HTTPException):
    # Prefer explicit machine-readable error_code if defined on custom domain exceptions
    code = getattr(exc, "error_code", None) or STATUS_CODE_TO_ERROR_CODE.get(exc.status_code, "ERROR")
    correlation_id = getattr(request.state, "correlation_id", None)
    
    # Log structured error if 5xx or 403/401 security events
    if exc.status_code >= 400:
        log_error(
            correlation_id=correlation_id,
            method=request.method,
            path=request.url.path,
            status_code=exc.status_code,
            error_code=code,
            exception_type=exc.__class__.__name__,
        )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": exc.status_code,
            "code": code,
            "detail": exc.detail,
            "correlation_id": correlation_id,
        },
        headers={"X-Correlation-ID": correlation_id} if correlation_id else {}
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    correlation_id = getattr(request.state, "correlation_id", None)
    
    log_error(
        correlation_id=correlation_id,
        method=request.method,
        path=request.url.path,
        status_code=422,
        error_code="UNPROCESSABLE_ENTITY",
        exception_type="RequestValidationError",
    )

    return JSONResponse(
        status_code=422,
        content={
            "status": 422,
            "code": "UNPROCESSABLE_ENTITY",
            "detail": jsonable_encoder(exc.errors()),
            "correlation_id": correlation_id,
        },
        headers={"X-Correlation-ID": correlation_id} if correlation_id else {}
    )

async def generic_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", None)
    tb_str = traceback.format_exc()
    
    # Structured JSON error log
    log_error(
        correlation_id=correlation_id,
        method=request.method,
        path=request.url.path,
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR",
        exception_type=exc.__class__.__name__,
        stack_trace=tb_str,
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "status": 500,
            "code": "INTERNAL_SERVER_ERROR",
            "detail": "An unexpected error occurred. Please try again later.",
            "correlation_id": correlation_id,
        },
        headers={"X-Correlation-ID": correlation_id} if correlation_id else {}
    )
