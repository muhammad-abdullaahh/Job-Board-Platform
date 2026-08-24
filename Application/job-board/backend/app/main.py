from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, jobs, applications, companies, users
import app.models  # Load models for table creation

# Create database tables automatically if missing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Board Platform API",
    description="High-performance backend API for Job Board Platform built with FastAPI, SQLAlchemy & PostgreSQL.",
    version="1.0.0"
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "message": "Welcome to Job Board Platform API",
        "docs": "/docs",
        "version": "1.0.0"
    }
