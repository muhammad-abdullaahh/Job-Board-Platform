import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger("app.error_handlers")

STATUS_CODE_TO_ERROR_CODE = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    500: "INTERNAL_SERVER_ERROR",
}

async def http_exception_handler(request: Request, exc: HTTPException):
    code = STATUS_CODE_TO_ERROR_CODE.get(exc.status_code, "ERROR")
    correlation_id = getattr(request.state, "correlation_id", None)
    
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

async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    correlation_id = getattr(request.state, "correlation_id", None)
    
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
