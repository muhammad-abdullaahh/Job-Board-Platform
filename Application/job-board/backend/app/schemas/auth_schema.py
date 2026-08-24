from pydantic import BaseModel, EmailStr
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str


class TokenData(BaseModel):
    sub: Optional[int] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    is_admin: bool = False


class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    bio: Optional[str] = None
    years_of_experience: int = 0


class AdminRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
