from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.schemas.auth_schema import Token

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_in) -> Token:
        existing_user = self.user_repo.get_user_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_in.email}' is already registered."
            )

        if getattr(user_in, 'is_admin', False):
            admin = self.user_repo.create_admin(user_in)
            role = "admin"
            token_str = create_access_token(
                data={"sub": str(admin.admin_id), "role": role, "email": admin.email}
            )
            return Token(
                access_token=token_str,
                token_type="bearer",
                role=role,
                user_id=admin.admin_id,
                name=admin.name,
                email=admin.email,
            )

        user = self.user_repo.create_user(user_in)
        role = "user"
        token_str = create_access_token(
            data={"sub": str(user.user_id), "role": role, "email": user.email}
        )
        return Token(
            access_token=token_str,
            token_type="bearer",
            role=role,
            user_id=user.user_id,
            name=user.name,
            email=user.email,
        )

    def login(self, login_in) -> Token:
        user = self.user_repo.get_user_by_email(login_in.email)
        if user:
            if not verify_password(login_in.password, user.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password."
                )
            role = "user"
            token_str = create_access_token(
                data={"sub": str(user.user_id), "role": role, "email": user.email}
            )
            return Token(
                access_token=token_str,
                token_type="bearer",
                role=role,
                user_id=user.user_id,
                name=user.name,
                email=user.email,
            )

        admin = self.user_repo.get_admin_by_email(login_in.email)
        if admin:
            if not verify_password(login_in.password, admin.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password."
                )
            role = "admin"
            token_str = create_access_token(
                data={"sub": str(admin.admin_id), "role": role, "email": admin.email}
            )
            return Token(
                access_token=token_str,
                token_type="bearer",
                role=role,
                user_id=admin.admin_id,
                name=admin.name,
                email=admin.email,
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    def request_password_reset(self, email: str) -> str:
        clean_email = email.strip().lower()
        user = self.user_repo.get_user_by_email(clean_email)
        admin = self.user_repo.get_admin_by_email(clean_email)
        
        if not user and not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No registered account found with email '{clean_email}'."
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
        if user:
            hashed_pw = get_password_hash(new_password)
            self.user_repo.update_user_password(user, hashed_pw)
            return

        admin = self.user_repo.get_admin_by_email(email)
        if admin:
            hashed_pw = get_password_hash(new_password)
            self.user_repo.update_admin_password(admin, hashed_pw)
            return

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account associated with token no longer exists."
        )
