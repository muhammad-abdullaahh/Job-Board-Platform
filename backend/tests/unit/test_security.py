import pytest
from datetime import timedelta
from jose import jwt
from app.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    create_refresh_token,
    decode_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
    hash_token,
    generate_refresh_token_string,
)

def test_password_hashing_and_verification():
    raw_password = "SuperSecretPassword123!"
    hashed = get_password_hash(raw_password)

    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False

def test_password_length_over_72_bytes_handled():
    # Bcrypt truncates/handles up to 72 bytes safely
    long_pass = "A" * 100
    hashed = get_password_hash(long_pass)
    assert verify_password(long_pass, hashed) is True
    assert verify_password("A" * 50, hashed) is False

def test_access_token_creation_and_decoding():
    data = {"sub": "123", "role": "admin", "email": "admin@example.com"}
    token = create_access_token(data, expires_delta=timedelta(minutes=5))
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "123"
    assert payload["role"] == "admin"
    assert payload["email"] == "admin@example.com"
    assert payload["type"] == "access"

def test_access_token_tampered_fails():
    data = {"sub": "123"}
    token = create_access_token(data)
    tampered_token = token[:-5] + "abcde"
    assert decode_access_token(tampered_token) is None
    assert decode_access_token("invalid.jwt.token") is None

def test_access_token_expired_fails():
    data = {"sub": "123"}
    token = create_access_token(data, expires_delta=timedelta(seconds=-10))
    assert decode_access_token(token) is None

def test_decode_access_token_rejects_non_access_type():
    # If token has type="refresh" instead of "access", decode_access_token must reject it
    token = jwt.encode({"sub": "123", "type": "refresh"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    assert decode_access_token(token) is None

def test_refresh_token_lifecycle():
    token_str = generate_refresh_token_string()
    assert isinstance(token_str, str)
    assert len(token_str) > 30

    token_hash = hash_token(token_str)
    assert isinstance(token_hash, str)
    assert len(token_hash) == 64  # SHA-256 hex length
    assert hash_token(token_str) == token_hash

    # Test JWT refresh token
    jwt_refresh = create_refresh_token({"sub": "456"})
    decoded = decode_refresh_token(jwt_refresh)
    assert decoded is not None
    assert decoded["sub"] == "456"
    assert decoded["type"] == "refresh"
    assert "jti" in decoded

def test_decode_refresh_token_rejects_non_refresh_type():
    jwt_access = create_access_token({"sub": "456"})
    assert decode_refresh_token(jwt_access) is None

def test_password_reset_token_lifecycle():
    email = "user@testplatform.com"
    token = create_password_reset_token(email)
    assert isinstance(token, str)

    verified_email = verify_password_reset_token(token)
    assert verified_email == email

def test_password_reset_token_tampered_or_invalid():
    assert verify_password_reset_token("invalid_token_string") is None
    
    # Tampered token with wrong type
    fake_token = jwt.encode({"sub": "attacker@fake.com", "type": "access"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    assert verify_password_reset_token(fake_token) is None
