import os
import uuid
import time
import logging
from contextlib import asynccontextmanager
from sqlalchemy import text
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth, jobs, applications, companies, users, admin
from fastapi.exceptions import RequestValidationError
from app.scheduler import start_scheduler
from app.core.error_handlers import http_exception_handler, generic_exception_handler, validation_exception_handler
from app.core.logging import log_request
import app.models  # Ensure all models are registered with Base metadata

logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables for development/local execution
    if not os.getenv("VERCEL"):
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            logger.warning(f"Database table initialization notice: {e}")

    # Start APScheduler background task
    scheduler = None
    if not os.getenv("VERCEL"):
        scheduler = start_scheduler()
    yield
    if scheduler:
        scheduler.shutdown()

app = FastAPI(
    title="Job Board Platform API",
    description="REST API for Job Board Platform — FastAPI + PostgreSQL",
    version="1.0.0",
    lifespan=lifespan
)

# Register Exception Handlers for Machine-Readable Responses
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Structured JSON Access Logging Middleware (Plan Spec #16)
@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    correlation_id = request.headers.get("X-Correlation-ID") or f"req-{uuid.uuid4().hex[:12]}"
    request.state.correlation_id = correlation_id

    response = await call_next(request)

    duration_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Correlation-ID"] = correlation_id

    # Emit structured JSON log entry for every HTTP request
    client_ip = request.client.host if request.client else None
    log_request(
        correlation_id=correlation_id,
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
        client_ip=client_ip
    )

    return response

# Configure CORS origins
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
if settings.FRONTEND_URL:
    clean_frontend = settings.FRONTEND_URL.strip().rstrip("/")
    if clean_frontend and clean_frontend not in cors_origins:
        cors_origins.append(clean_frontend)

if settings.CORS_ORIGINS:
    extra_origins = [orig.strip().rstrip("/") for orig in settings.CORS_ORIGINS.split(",") if orig.strip()]
    for orig in extra_origins:
        if orig not in cors_origins:
            cors_origins.append(orig)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include all routers with /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1/job-seekers", tags=["Job Seekers (Alias)"])
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Job Board Platform API is running smoothly",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    """Liveness probe: confirms application process is alive (Plan Spec #19)."""
    return {
        "status": "healthy",
        "service": "Job Board Platform API"
    }

@app.get("/ready")
def readiness_check():
    """Readiness probe: strictly verifies database connectivity (Plan Spec #19)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Readiness check database connection failed: {e}")
        raise HTTPException(status_code=503, detail="Database service is temporarily unavailable. Please try again later.")
