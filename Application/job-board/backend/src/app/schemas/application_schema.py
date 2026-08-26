from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.application import ApplicationStatus
from app.schemas.job_schema import JobResponse
from app.schemas.user_schema import UserResponse


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: str


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    # Note: offer_issued_at and offer_expires_at are set automatically
    # by the service layer when status transitions to "offer_issued".
    # Do not accept them from the client directly.


class ApplicationResponse(BaseModel):
    application_id: int
    user_id: int
    job_id: int
    cover_letter: str
    status: ApplicationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Offer letter fields — null unless an offer has been issued
    offer_issued_at: Optional[datetime] = None
    offer_expires_at: Optional[datetime] = None

    job: Optional[JobResponse] = None
    applicant: Optional[UserResponse] = None

    class Config:
        from_attributes = True
