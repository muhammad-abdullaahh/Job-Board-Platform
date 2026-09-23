# User Schemas
# Defines Pydantic models for user profile updates, role assignments, and API responses.
# Serializes user accounts and associated skill lists for client communication.

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

class AdminRoleUpdate(BaseModel):
    is_admin: bool

class DeleteAccountRequest(BaseModel):
    password: str

class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    is_admin: bool = False
    bio: Optional[str] = None
    years_of_experience: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[int] = None
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True
