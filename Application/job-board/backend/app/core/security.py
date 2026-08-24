from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # TODO: Use pwd_context to verify plain password against the hash
    pass


def get_password_hash(password: str) -> str:
    # TODO: Use pwd_context to hash the password and return it
    pass


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # TODO: Copy data, set expiry, encode using settings.SECRET_KEY and settings.ALGORITHM
    pass


def decode_access_token(token: str) -> Optional[dict]:
    # TODO: Decode JWT, return payload dict or None on failure
    pass


def create_password_reset_token(email: str) -> str:
    # TODO: Generate a short-lived token (e.g. 15-30 minutes expiration) with type="password_reset"
    pass


def verify_password_reset_token(token: str) -> Optional[str]:
    # TODO: Decode token, check type=="password_reset", return email if valid, else None
    pass
