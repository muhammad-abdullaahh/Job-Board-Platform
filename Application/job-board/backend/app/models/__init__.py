from app.models.user import User
from app.models.company import Company
from app.models.skill import Skill, user_skills, job_skills
from app.models.job import Job, EmploymentType, JobStatus
from app.models.application import Application, ApplicationStatus

__all__ = [
    "User",           # Single unified model — is_admin=True means admin
    "Company",
    "Skill", "user_skills", "job_skills",
    "Job", "EmploymentType", "JobStatus",
    "Application", "ApplicationStatus"
]
