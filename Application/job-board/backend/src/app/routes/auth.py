from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth_schema import (
    LoginRequest,
    UserRegisterRequest,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.register_user(user_in)

@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(login_in)

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(request_in: ForgotPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token = service.request_password_reset(request_in.email)
    return {
        "message": f"If the email is registered, a password reset link has been dispatched. Token: {token}"
    }

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request_in: ResetPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    service.reset_password(request_in.token, request_in.new_password)
    return {"message": "Password has been successfully reset."}
