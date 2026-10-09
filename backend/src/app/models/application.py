# Job Application Model
# Tracks candidate job applications, cover letters, and application lifecycle statuses.
# Links applicants to specific job postings with unique submission constraints.

import enum
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from app.database import Base
from sqlalchemy import Integer, Text, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.job import Job

class ApplicationStatus(str, enum.Enum):
    pending         = "pending"
    reviewed        = "reviewed"
    shortlisted     = "shortlisted"
    offer_issued    = "offer_issued"    # Company sent the offer letter
    offer_accepted  = "offer_accepted"  # Candidate accepted the offer
    offer_declined  = "offer_declined"  # Candidate declined the offer
    hired           = "hired"           # Finalized — candidate onboarded
    rejected        = "rejected"
    expired         = "expired"         # 48h window passed, no response from candidate

class Application(Base):
    __tablename__ = "applications"

    application_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("jobs.job_id", ondelete="CASCADE"), nullable=False)
    cover_letter: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(SQLEnum(ApplicationStatus), default=ApplicationStatus.pending, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    offer_issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    offer_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job"),
    )

    # Relationships with explicit foreign_keys
    applicant: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="applications")
    job: Mapped["Job"] = relationship("Job", foreign_keys=[job_id], back_populates="applications")
