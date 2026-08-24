from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.application import ApplicationStatus
from app.schemas.job_schema import JobResponse
from app.schemas.user_schema import UserResponse


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: str


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    application_id: int
    user_id: int
    job_id: int
    cover_letter: str
    status: ApplicationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    job: Optional[JobResponse] = None
    applicant: Optional[UserResponse] = None

    class Config:
        from_attributes = True
