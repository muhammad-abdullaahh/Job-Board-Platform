import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


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

    job_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True, index=True)
    salary_min = Column(Integer, nullable=False, default=0)
    salary_max = Column(Integer, nullable=False, default=0)
    employment_type = Column(
        SQLEnum(EmploymentType, name="employment_type_enum"),
        nullable=False,
        index=True
    )
    status = Column(
        SQLEnum(JobStatus, name="job_status_enum"),
        nullable=False,
        default=JobStatus.open,
        index=True
    )
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True, onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="jobs")
    updater_user = relationship("User", foreign_keys=[updated_by], back_populates="updated_jobs")
    deleter_user = relationship("User", foreign_keys=[deleted_by], back_populates="deleted_jobs")
    skills = relationship("Skill", secondary="job_skills", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
