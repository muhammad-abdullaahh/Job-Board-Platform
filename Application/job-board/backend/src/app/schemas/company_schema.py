from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompanyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    employee_count: Optional[str] = None
    hr_contact_email: Optional[str] = None
    cro_linkedin: Optional[str] = None
    registration_number: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    employee_count: Optional[str] = None
    hr_contact_email: Optional[str] = None
    cro_linkedin: Optional[str] = None
    registration_number: Optional[str] = None
    is_verified: Optional[bool] = None


class CompanyRenameRequest(BaseModel):
    name: str


class PublicCompanyResponse(BaseModel):
    company_id: int
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    employee_count: Optional[str] = None
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompanyResponse(PublicCompanyResponse):
    # Confidential verification & ownership metadata reserved for owners and administrators
    hr_contact_email: Optional[str] = None
    cro_linkedin: Optional[str] = None
    registration_number: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

