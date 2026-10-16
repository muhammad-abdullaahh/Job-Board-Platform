import pytest
from app.services.auth_service import AuthService
from app.schemas.auth_schema import UserRegisterRequest, LoginRequest
from app.models.user import User
from app.core.security import get_password_hash
from app.exceptions import (
    UserAlreadyExistsException,
    InvalidCredentialsException,
    AccountSuspendedException,
    InvalidTokenException,
)

def test_auth_service_register_user_success(db_session):
    service = AuthService(db_session)
    reg_data = UserRegisterRequest(
        name="Alice Smith",
        email="alice@example.com",
        password="SecurePassword123!",
        years_of_experience=3
    )

    token, refresh_token = service.register_user(reg_data)
    assert token.access_token is not None
    assert token.email == "alice@example.com"
    assert token.role == "user"
    assert refresh_token is not None

def test_auth_service_register_duplicate_email(db_session):
    service = AuthService(db_session)
    reg_data = UserRegisterRequest(
        name="Alice Smith",
        email="duplicate@example.com",
        password="SecurePassword123!",
    )
    service.register_user(reg_data)

    # Attempt second registration with same email
    with pytest.raises(UserAlreadyExistsException):
        service.register_user(reg_data)

def test_auth_service_login_success_and_invalid_credentials(db_session):
    service = AuthService(db_session)
    reg_data = UserRegisterRequest(
        name="Bob Martin",
        email="bob@example.com",
        password="BobPassword123!",
    )
    service.register_user(reg_data)

    # Valid login
    login_valid = LoginRequest(email="bob@example.com", password="BobPassword123!")
    token, refresh_tok = service.login(login_valid)
    assert token.access_token is not None
    assert refresh_tok is not None

    # Invalid password
    login_bad_pw = LoginRequest(email="bob@example.com", password="WrongPassword999!")
    with pytest.raises(InvalidCredentialsException):
        service.login(login_bad_pw)

    # Nonexistent user
    login_unknown = LoginRequest(email="unknown@example.com", password="SomePassword123!")
    with pytest.raises(InvalidCredentialsException):
        service.login(login_unknown)

def test_auth_service_login_suspended_account(db_session):
    from datetime import datetime, timezone
    service = AuthService(db_session)
    suspended_user = User(
        name="Suspended User",
        email="suspended@example.com",
        password=get_password_hash("SuspendedPass123!"),
        deleted_at=datetime.now(timezone.utc)
    )
    db_session.add(suspended_user)
    db_session.commit()

    login_req = LoginRequest(email="suspended@example.com", password="SuspendedPass123!")
    with pytest.raises(AccountSuspendedException):
        service.login(login_req)

def test_auth_service_token_rotation_and_revocation(db_session):
    service = AuthService(db_session)
    reg_data = UserRegisterRequest(
        name="Rotate User",
        email="rotate@example.com",
        password="RotatePassword123!",
    )
    token, raw_refresh = service.register_user(reg_data)

    # Refresh
    new_token, new_refresh = service.refresh_access_token(raw_refresh)
    assert new_token.access_token is not None
    assert new_refresh != raw_refresh

    # Stale refresh token should now fail
    with pytest.raises(InvalidTokenException):
        service.refresh_access_token(raw_refresh)

    # Missing token fails
    with pytest.raises(InvalidTokenException):
        service.refresh_access_token("")

    # Logout
    assert service.logout(new_refresh) is True
    # Subsequent refresh fails
    with pytest.raises(InvalidTokenException):
        service.refresh_access_token(new_refresh)

def test_auth_service_password_reset_flow(db_session):
    service = AuthService(db_session)
    reg_data = UserRegisterRequest(
        name="Reset User",
        email="reset@example.com",
        password="OldPassword123!",
    )
    service.register_user(reg_data)

    # Request reset token
    reset_tok = service.request_password_reset("reset@example.com")
    assert reset_tok is not None

    # Reset for nonexistent email returns None
    assert service.request_password_reset("nobody@example.com") is None

    # Reset password
    service.reset_password(reset_tok, "NewBrandPassword123!")

    # Login with new password succeeds
    login_new = LoginRequest(email="reset@example.com", password="NewBrandPassword123!")
    tok, _ = service.login(login_new)
    assert tok.access_token is not None

    # Old password no longer works
    login_old = LoginRequest(email="reset@example.com", password="OldPassword123!")
    with pytest.raises(InvalidCredentialsException):
        service.login(login_old)

    # Invalid reset token fails
    with pytest.raises(InvalidTokenException):
        service.reset_password("tampered_token", "AnotherPassword123!")
