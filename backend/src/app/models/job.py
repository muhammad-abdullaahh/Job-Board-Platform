# Job Listing Model
# Defines job postings including title, description, employment type, salary range, and status.
# Links jobs to their hiring company, required skills, and candidate applications.

import enum
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.database import Base
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.models.skill import job_skills

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.skill import Skill
    from app.models.application import Application

class EmploymentType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    remote = "remote"
    internship = "internship"

class JobStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    draft = "draft"

class Job(Base):
    __tablename__ = "jobs"

    job_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.company_id", ondelete="CASCADE"), nullable=False)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    salary_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    employment_type: Mapped[EmploymentType] = mapped_column(SQLEnum(EmploymentType), default=EmploymentType.full_time, nullable=False)
    status: Mapped[JobStatus] = mapped_column(SQLEnum(JobStatus), default=JobStatus.open, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    deleted_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    __table_args__ = (
        CheckConstraint("salary_min IS NULL OR salary_min >= 0", name="chk_job_salary_min"),
        CheckConstraint("salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min", name="chk_job_salary_max"),
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="jobs")
    skills: Mapped[List["Skill"]] = relationship("Skill", secondary=job_skills, back_populates="jobs")
    applications: Mapped[List["Application"]] = relationship("Application", foreign_keys="[Application.job_id]", back_populates="job", cascade="all, delete-orphan")
