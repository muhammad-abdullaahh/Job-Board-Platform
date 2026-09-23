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
        "postgresql://postgres:postgres@localhost:5432/Job-Board-Platform"
    )
    SECRET_KEY: str = "job-board-dev-secret-key-do-not-use-in-prod"
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

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.ENVIRONMENT.lower() == "production":
            key = (self.SECRET_KEY or "").strip()
            if not key or key in INSECURE_DEFAULT_SECRETS or len(key) < 32:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: A secure, high-entropy SECRET_KEY "
                    "(at least 32 characters) must be configured in environment variables for production mode. "
                    "Cannot use default or placeholder keys."
                )
        return self

    model_config = SettingsConfigDict(
        env_file=[str(BACKEND_DIR / ".env"), ".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
