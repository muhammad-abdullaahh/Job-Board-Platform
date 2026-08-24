from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class SkillResponse(BaseModel):
    skill_id: int
    name: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    years_of_experience: Optional[int] = None
    skill_ids: Optional[List[int]] = None


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    bio: Optional[str] = None
    years_of_experience: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True


class AdminResponse(BaseModel):
    admin_id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True
