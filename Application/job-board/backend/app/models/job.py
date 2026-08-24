import enum
from app.database import Base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship


class EmploymentType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"


class JobStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    draft = "draft"


class Job(Base):
    __tablename__ = "jobs"

    # TODO: Define columns matching the SQL schema
    # job_id, company_id (FK -> companies),
    # title, description, location,
    # salary_min, salary_max,
    # employment_type (EmploymentType enum),
    # status (JobStatus enum),
    # created_at, updated_at,
    # updated_by (FK -> users), deleted_at, deleted_by (FK -> users)
    pass

    # TODO: Define relationships
    # - company
    # - skills (many-to-many via job_skills)
    # - applications
    # - updater_user, deleter_user
