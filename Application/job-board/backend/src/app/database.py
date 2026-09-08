import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from app.config import settings

logger = logging.getLogger("app.database")

DATABASE_URL = settings.DATABASE_URL

# Detect serverless environment (e.g., Vercel, AWS Lambda)
is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))

connect_args = {}
if DATABASE_URL.startswith("postgresql"):
    connect_args["connect_timeout"] = 10
    # Enable SSL mode for Supabase endpoints if not already specified in URL
    if ("supabase.co" in DATABASE_URL or "pooler.supabase.com" in DATABASE_URL) and "sslmode=" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

if is_serverless:
    # In serverless environments, do NOT maintain persistent connection pools.
    # Persistent pools across serverless lambdas exhaust Supabase connection limits quickly.
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args=connect_args,
    )
else:
    # For long-running servers (e.g. local uvicorn, Docker):
    # Use a bounded pool with aggressive recycle so dropped/idle Supabase connections are refreshed.
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=5,
        pool_timeout=15,
        pool_recycle=300,
        pool_pre_ping=True,
        connect_args=connect_args,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

