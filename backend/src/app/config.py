# Application Configuration
# Loads environment variables and defines application-wide settings.
# Manages database connections, security tokens, and CORS settings.

import os
from pathlib import Path
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get path to backend directory (parent of src)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

INSECURE_DEFAULT_SECRETS = {
    "job-board-super-secret-key-2026",
    "job-board-dev-secret-key-do-not-use-in-prod",
    "change-this-to-a-secure-random-secret-key-for-production",
    "dev-super-secret-key-change-in-production",
    "super-secret-jwt-key-change-in-production-1234567890",
    "secret",
    "password",
}

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        os.getenv(
            "POSTGRES_URL",
            os.getenv("POSTGRES_PRISMA_URL", "postgresql://postgres:postgres@localhost:5432/Job-Board-Platform")
        )
    )
    SECRET_KEY: str = (
        os.getenv("SECRET_KEY")
        or os.getenv("JWT_SECRET_KEY")
        or "job-board-dev-secret-key-do-not-use-in-prod"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 1440
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = ""
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # SMTP & Email Delivery Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@job-board.com"
    SMTP_FROM_NAME: str = "Job-Board Platform"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    FRONTEND_URL: str = "http://localhost:5173"

    @model_validator(mode="before")
    @classmethod
    def resolve_environment_fallbacks(cls, data: object) -> object:
        if isinstance(data, dict):
            # Fallback for JWT_SECRET_KEY -> SECRET_KEY
            if not data.get("SECRET_KEY") or data.get("SECRET_KEY") in INSECURE_DEFAULT_SECRETS:
                jwt_key = os.getenv("JWT_SECRET_KEY") or data.get("JWT_SECRET_KEY")
                if jwt_key:
                    data["SECRET_KEY"] = jwt_key
            # Fallback for alternative postgres URL keys
            if not data.get("DATABASE_URL") or "localhost:5432" in data.get("DATABASE_URL", ""):
                for alt_key in ["POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"]:
                    val = os.getenv(alt_key)
                    if val:
                        data["DATABASE_URL"] = val
                        break
        return data

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        is_production = (
            self.ENVIRONMENT.lower() == "production"
            or os.getenv("VERCEL_ENV") == "production"
        )
        if is_production:
            missing_or_invalid = []

            # 1. Validate SECRET_KEY / JWT_SECRET_KEY
            key = (self.SECRET_KEY or "").strip()
            if not key or key in INSECURE_DEFAULT_SECRETS:
                missing_or_invalid.append(
                    "SECRET_KEY (or JWT_SECRET_KEY) is missing or set to an insecure default placeholder. "
                    "Configure a unique 32+ character key in Vercel Environment Variables."
                )
            elif len(key) < 32:
                missing_or_invalid.append(
                    f"SECRET_KEY (or JWT_SECRET_KEY) is too short ({len(key)} chars; minimum 32 chars required)."
                )

            # 2. Validate DATABASE_URL when deployed to Vercel/production
            if os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
                db_url = (self.DATABASE_URL or "").strip()
                if not db_url or "localhost:5432" in db_url or "127.0.0.1:5432" in db_url:
                    missing_or_invalid.append(
                        "DATABASE_URL is missing or defaulting to localhost:5432. "
                        "Configure your remote PostgreSQL connection string (Supabase/Railway) in Vercel Environment Variables."
                    )

            if missing_or_invalid:
                error_msg = (
                    "CRITICAL PRODUCTION CONFIGURATION ERROR: Startup checks failed:\n"
                    + "\n".join(f"  • {err}" for err in missing_or_invalid)
                )
                import logging
                logging.getLogger("app.config").critical(error_msg)
                raise ValueError(error_msg)
        return self

    # On Vercel, env variables come exclusively from the dashboard; disable loading local .env file
    model_config = SettingsConfigDict(
        env_file=None if os.getenv("VERCEL") else [str(BACKEND_DIR / ".env"), ".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
