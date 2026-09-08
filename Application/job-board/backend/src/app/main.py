import os
import uuid
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
import app.models  # Ensure all models are loaded

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables (skip on serverless where tables already exist to prevent 5-10s cold-start timeouts)
    if not os.getenv("VERCEL"):
        try:
            Base.metadata.create_all(bind=engine)
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id)"))
                conn.execute(text("UPDATE companies SET created_by = updated_by WHERE created_by IS NULL AND updated_by IS NOT NULL"))
                conn.commit()
        except Exception as e:
            # Safe pass if tables already initialized or temporary network hiccup
            pass

    # Start APScheduler background task (skip on serverless where background threads are frozen)
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

# Correlation ID Middleware (Spec #13)
@app.middleware("http")
async def add_correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or f"req-{uuid.uuid4().hex[:12]}"
    request.state.correlation_id = correlation_id
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
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
    return {
        "status": "healthy",
        "service": "Job Board Platform API"
    }

@app.get("/ready")
def readiness_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {e}")
