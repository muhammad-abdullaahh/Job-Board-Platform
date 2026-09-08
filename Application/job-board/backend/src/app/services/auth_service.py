from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.schemas.auth_schema import Token

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_in) -> Token:
        existing_user = self.user_repo.get_user_by_email(user_in.email, include_deleted=True)
        if existing_user:
            if existing_user.deleted_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"An account with email '{user_in.email}' is currently suspended. Please contact support."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_in.email}' is already registered."
            )

        user = self.user_repo.create_user(user_in)
        role = "admin" if user.is_admin else "user"
        access_token_str = create_access_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        refresh_token_str = create_refresh_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        return Token(
            access_token=access_token_str,
            refresh_token=refresh_token_str,
            token_type="bearer",
            role=role,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
        )

    def login(self, login_in) -> Token:
        user = self.user_repo.get_user_by_email(login_in.email, include_deleted=True)
        if not user or not verify_password(login_in.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended by an administrator. Please contact support."
            )

        role = "admin" if user.is_admin else "user"
        access_token_str = create_access_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        refresh_token_str = create_refresh_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        return Token(
            access_token=access_token_str,
            refresh_token=refresh_token_str,
            token_type="bearer",
            role=role,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
        )

    def refresh_access_token(self, refresh_token_str: str) -> Token:
        if not refresh_token_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token cookie missing."
            )
        
        payload = decode_refresh_token(refresh_token_str)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )
        
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload."
            )
            
        user = self.user_repo.get_user_by_id(int(user_id_str), include_deleted=True)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with token no longer exists."
            )
        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account has been suspended by an administrator."
            )

        role = "admin" if user.is_admin else "user"
        new_access_token = create_access_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            role=role,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
        )

    def request_password_reset(self, email: str) -> Optional[str]:
        clean_email = email.strip().lower()
        user = self.user_repo.get_user_by_email(clean_email, include_deleted=True)
        if not user:
            return None
        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been suspended by an administrator. Password reset is not permitted."
            )
        return create_password_reset_token(clean_email)

    def reset_password(self, token: str, new_password: str):
        clean_token = token.strip().strip('"').strip("'")
        email = verify_password_reset_token(clean_token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token."
            )
            
        user = self.user_repo.get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account associated with token no longer exists."
            )

        hashed_pw = get_password_hash(new_password)
        self.user_repo.update_user_password(user, hashed_pw)
