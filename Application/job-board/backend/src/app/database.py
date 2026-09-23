# Database Configuration and Session Management
# Sets up the SQLAlchemy database engine, connection pooling, and session factories.
# Handles automatic table migrations and schema integrity on application startup.

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

from sqlalchemy import text

_db_migrated = False

def ensure_db_migrated():
    global _db_migrated
    if not _db_migrated:
        try:
            import app.models  # ensure all models registered with Base metadata
            Base.metadata.create_all(bind=engine)
            if DATABASE_URL.startswith("postgresql"):
                with engine.connect() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS refresh_tokens (
                            token_id SERIAL PRIMARY KEY,
                            token_hash VARCHAR(255) NOT NULL UNIQUE,
                            user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                            expires_at TIMESTAMPTZ NOT NULL,
                            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                            revoked_at TIMESTAMPTZ
                        );
                        CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens(token_hash);
                        CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens(user_id);
                        ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id);
                        UPDATE companies SET created_by = updated_by WHERE created_by IS NULL AND updated_by IS NOT NULL;
                        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
                        CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_unique ON users (lower(email)) WHERE deleted_at IS NULL;
                    """))
                    conn.commit()
            _db_migrated = True
        except Exception as e:
            logger.warning(f"Auto-migration notice: {e}")

def get_db():
    ensure_db_migrated()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


