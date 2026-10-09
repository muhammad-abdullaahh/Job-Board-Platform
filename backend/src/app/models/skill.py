# Skill Model and Association Tables
# Defines standardized technical and professional skills across the platform.
# Manages many-to-many relationship tables linking skills to users and job postings.

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.job import Job

# Junction table: user_skills
user_skills = Table(
    "user_skills",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True),
)

# Junction table: job_skills
job_skills = Table(
    "job_skills",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("jobs.job_id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True),
)

class Skill(Base):
    __tablename__ = "skills"

    skill_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    # Relationships
    creator_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])
    users: Mapped[List["User"]] = relationship("User", secondary=user_skills, back_populates="skills")
    jobs: Mapped[List["Job"]] = relationship("Job", secondary=job_skills, back_populates="skills")
