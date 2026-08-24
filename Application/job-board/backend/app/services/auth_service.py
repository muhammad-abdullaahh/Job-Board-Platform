from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import LoginRequest, UserRegisterRequest, AdminRegisterRequest, Token
from app.core.security import verify_password, create_access_token


class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_in: UserRegisterRequest) -> Token:
        existing = self.user_repo.get_user_by_email(user_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        user = self.user_repo.create_user(user_in)
        token = create_access_token(data={"sub": user.user_id, "role": "user"})
        return Token(
            access_token=token,
            role="user",
            user_id=user.user_id,
            name=user.name,
            email=user.email
        )

    def register_admin(self, admin_in: AdminRegisterRequest) -> Token:
        existing = self.user_repo.get_admin_by_email(admin_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin with this email already exists"
            )
        admin = self.user_repo.create_admin(admin_in)
        token = create_access_token(data={"sub": admin.admin_id, "role": "admin"})
        return Token(
            access_token=token,
            role="admin",
            user_id=admin.admin_id,
            name=admin.name,
            email=admin.email
        )

    def login(self, login_in: LoginRequest) -> Token:
        if login_in.is_admin:
            admin = self.user_repo.get_admin_by_email(login_in.email)
            if not admin or not verify_password(login_in.password, admin.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid admin credentials"
                )
            token = create_access_token(data={"sub": admin.admin_id, "role": "admin"})
            return Token(
                access_token=token,
                role="admin",
                user_id=admin.admin_id,
                name=admin.name,
                email=admin.email
            )
        else:
            user = self.user_repo.get_user_by_email(login_in.email)
            if not user or not verify_password(login_in.password, user.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user credentials"
                )
            token = create_access_token(data={"sub": user.user_id, "role": "user"})
            return Token(
                access_token=token,
                role="user",
                user_id=user.user_id,
                name=user.name,
                email=user.email
            )
