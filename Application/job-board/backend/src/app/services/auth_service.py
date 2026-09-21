from typing import Optional, Tuple
from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_refresh_token_string,
    hash_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.schemas.auth_schema import Token
from app.exceptions import (
    UserAlreadyExistsException,
    InvalidCredentialsException,
    AccountSuspendedException,
    InvalidTokenException,
    UserNotFoundException,
)

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.token_repo = RefreshTokenRepository(db)

    def _generate_and_store_refresh_token(self, user_id: int) -> str:
        """Generate a secure refresh token and store its hash in the database."""
        raw_token = generate_refresh_token_string()
        token_hash = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
        self.token_repo.create(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        return raw_token

    def register_user(self, user_in) -> Tuple[Token, str]:
        active_user = self.user_repo.get_user_by_email(user_in.email, include_deleted=False)
        if active_user:
            raise UserAlreadyExistsException(f"Email '{user_in.email}' is already registered.")

        try:
            user = self.user_repo.create_user(user_in)
        except IntegrityError:
            raise UserAlreadyExistsException(f"Email '{user_in.email}' is already registered.")

        role = "admin" if user.is_admin else "user"
        access_token_str = create_access_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        raw_refresh_token = self._generate_and_store_refresh_token(user.user_id)

        token_data = Token(
            access_token=access_token_str,
            token_type="bearer",
            role=role,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
        )
        return token_data, raw_refresh_token

    def login(self, login_in) -> Tuple[Token, str]:
        user = self.user_repo.get_user_by_email(login_in.email, include_deleted=False)
        if not user:
            deleted_user = self.user_repo.get_user_by_email(login_in.email, include_deleted=True)
            if deleted_user and deleted_user.deleted_at is not None and verify_password(login_in.password, deleted_user.password):
                raise AccountSuspendedException()
            raise InvalidCredentialsException()

        if not verify_password(login_in.password, user.password):
            raise InvalidCredentialsException()

        role = "admin" if user.is_admin else "user"
        access_token_str = create_access_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        raw_refresh_token = self._generate_and_store_refresh_token(user.user_id)

        token_data = Token(
            access_token=access_token_str,
            token_type="bearer",
            role=role,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
        )
        return token_data, raw_refresh_token

    def refresh_access_token(self, refresh_token_str: str) -> Tuple[Token, str]:
        if not refresh_token_str:
            raise InvalidTokenException("Refresh token cookie missing.")

        token_hash = hash_token(refresh_token_str.strip())
        token_record = self.token_repo.get_active_by_hash(token_hash)
        if not token_record:
            raise InvalidTokenException("Invalid, expired, or revoked refresh token.")

        user = self.user_repo.get_user_by_id(token_record.user_id, include_deleted=True)
        if not user:
            raise InvalidTokenException("User associated with token no longer exists.")
        if user.deleted_at is not None:
            raise AccountSuspendedException()

        # Token rotation: revoke previous token record
        self.token_repo.revoke_by_hash(token_hash)

        # Issue new token pair
        role = "admin" if user.is_admin else "user"
        new_access_token = create_access_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        new_raw_refresh_token = self._generate_and_store_refresh_token(user.user_id)

        token_data = Token(
            access_token=new_access_token,
            token_type="bearer",
            role=role,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
        )
        return token_data, new_raw_refresh_token

    def logout(self, refresh_token_str: Optional[str]) -> bool:
        if refresh_token_str:
            token_hash = hash_token(refresh_token_str.strip())
            return self.token_repo.revoke_by_hash(token_hash)
        return False

    def request_password_reset(self, email: str) -> Optional[str]:
        clean_email = email.strip().lower()
        user = self.user_repo.get_user_by_email(clean_email, include_deleted=False)
        if not user:
            return None
        return create_password_reset_token(clean_email)

    def reset_password(self, token: str, new_password: str):
        clean_token = token.strip().strip('"').strip("'")
        email = verify_password_reset_token(clean_token)
        if not email:
            raise InvalidTokenException("Invalid or expired password reset token.")

        user = self.user_repo.get_user_by_email(email)
        if not user:
            raise UserNotFoundException("Account associated with token no longer exists.")

        hashed_pw = get_password_hash(new_password)
        self.user_repo.update_user_password(user, hashed_pw)
        # Invalidate all existing refresh tokens for security on password change
        self.token_repo.revoke_all_for_user(user.user_id)
