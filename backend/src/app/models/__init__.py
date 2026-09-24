# Models Package
# Exports all SQLAlchemy ORM models to register them with metadata.
# Ensures database tables and foreign key relationships are properly initialized.

from app.models.user import User
from app.models.company import Company
from app.models.skill import Skill, user_skills, job_skills
from app.models.job import Job, EmploymentType, JobStatus
from app.models.application import Application, ApplicationStatus
from app.models.refresh_token import RefreshToken

__all__ = [
    "User",           # Single unified model — is_admin=True means admin
    "Company",
    "Skill", "user_skills", "job_skills",
    "Job", "EmploymentType", "JobStatus",
    "Application", "ApplicationStatus",
    "RefreshToken"
]
