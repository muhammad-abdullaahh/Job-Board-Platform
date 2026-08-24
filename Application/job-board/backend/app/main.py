from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, jobs, applications, companies, users
from app.scheduler import start_scheduler
import app.models  # Ensure all models are loaded

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Start APScheduler background task for 48h offer expiration
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="Job Board Platform API",
    description="REST API for Job Board Platform — FastAPI + SQLite/PostgreSQL",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Job Board Platform API is running smoothly",
        "docs": "/docs",
        "version": "1.0.0"
    }
