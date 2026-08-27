from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class SkillCreate(BaseModel):
    name: str

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
    is_admin: bool = False
    bio: Optional[str] = None
    years_of_experience: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True
