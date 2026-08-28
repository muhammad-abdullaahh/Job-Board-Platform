import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get path to backend directory (parent of src)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:helloworld@localhost:5432/Job-Board-Platform"
    )
    SECRET_KEY: str = "job-board-super-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 1440

    model_config = SettingsConfigDict(
        env_file=[str(BACKEND_DIR / ".env"), ".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
