from fastapi import APIRouter, Depends, status, Response, Cookie, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.email_service import email_service
from app.config import settings
from app.schemas.auth_schema import (
    LoginRequest,
    UserRegisterRequest,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_refresh_cookie(response: Response, refresh_token: str):
    max_age = settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
    is_prod = settings.ENVIRONMENT.lower() == "production" or settings.COOKIE_SECURE
    samesite = "none" if is_prod else settings.COOKIE_SAMESITE
    secure = True if is_prod else settings.COOKIE_SECURE
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=max_age,
        expires=max_age,
        samesite=samesite,
        secure=secure,
        path="/"
    )

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegisterRequest, response: Response, db: Session = Depends(get_db)):
    service = AuthService(db)
    token_res = service.register_user(user_in)
    if token_res.refresh_token:
        set_refresh_cookie(response, token_res.refresh_token)
    return token_res

@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, response: Response, db: Session = Depends(get_db)):
    service = AuthService(db)
    token_res = service.login(login_in)
    if token_res.refresh_token:
        set_refresh_cookie(response, token_res.refresh_token)
    return token_res

@router.post("/refresh", response_model=Token)
def refresh_token(
    response: Response,
    request: Request,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    cookie_token = refresh_token or request.cookies.get("refresh_token")
    service = AuthService(db)
    token_res = service.refresh_access_token(cookie_token)
    if token_res.refresh_token:
        set_refresh_cookie(response, token_res.refresh_token)
    return token_res

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response):
    is_prod = settings.ENVIRONMENT.lower() == "production" or settings.COOKIE_SECURE
    samesite = "none" if is_prod else settings.COOKIE_SAMESITE
    secure = True if is_prod else settings.COOKIE_SECURE
    response.delete_cookie(key="refresh_token", path="/", samesite=samesite, secure=secure)
    return {"message": "Successfully logged out"}

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(request_in: ForgotPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token = service.request_password_reset(request_in.email)
    delivery = email_service.send_password_reset_email(to_email=request_in.email, token=token)
    return {
        "status": "success",
        "message": delivery["message"],
        "email_sent": delivery["sent"],
        "reset_link": delivery.get("reset_link"),
        "token": token
    }

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request_in: ResetPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    service.reset_password(request_in.token, request_in.new_password)
    return {"message": "Password has been successfully reset."}
