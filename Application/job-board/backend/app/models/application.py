import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"
    shortlisted = "shortlisted"
    accepted = "accepted"
    rejected = "rejected"


class Application(Base):
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.job_id", ondelete="CASCADE"), nullable=False, index=True)
    cover_letter = Column(Text, nullable=False)
    status = Column(
        SQLEnum(ApplicationStatus, name="application_status_enum"),
        nullable=False,
        default=ApplicationStatus.pending
    )
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True, onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job"),
    )

    # Relationships
    applicant = relationship("User", foreign_keys=[user_id], back_populates="applications")
    job = relationship("Job", foreign_keys=[job_id], back_populates="applications")
    updater_user = relationship("User", foreign_keys=[updated_by])
