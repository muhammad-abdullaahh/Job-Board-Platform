from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth_schema import (
    LoginRequest, UserRegisterRequest, AdminRegisterRequest, Token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegisterRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.register_user(user_in)


@router.post("/register-admin", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_admin(admin_in: AdminRegisterRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.register_admin(admin_in)


@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.login(login_in)
