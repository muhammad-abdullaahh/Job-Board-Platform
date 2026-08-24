from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.job import EmploymentType, JobStatus
from app.schemas.company_schema import CompanyResponse
from app.schemas.user_schema import SkillResponse


class JobCreate(BaseModel):
    company_id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    salary_min: int = 0
    salary_max: int = 0
    employment_type: EmploymentType
    status: JobStatus = JobStatus.open
    skill_ids: Optional[List[int]] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    employment_type: Optional[EmploymentType] = None
    status: Optional[JobStatus] = None
    skill_ids: Optional[List[int]] = None


class JobResponse(BaseModel):
    job_id: int
    company_id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    salary_min: int
    salary_max: int
    employment_type: EmploymentType
    status: JobStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    company: Optional[CompanyResponse] = None
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True
