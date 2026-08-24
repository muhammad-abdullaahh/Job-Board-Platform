from pydantic import BaseModel, EmailStr
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str        # "admin" or "user" — derived from is_admin field
    user_id: int
    name: str
    email: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    bio: Optional[str] = None
    years_of_experience: int = 0
    is_admin: bool = False   # True only for admin registration


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
