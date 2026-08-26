import enum
from app.database import Base
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

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

    application_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id", ondelete="CASCADE"), nullable=False)
    cover_letter = Column(Text, nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.pending, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    offer_issued_at = Column(DateTime(timezone=True), nullable=True)
    offer_expires_at = Column(DateTime(timezone=True), nullable=True)

    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job"),
    )

    # Relationships with explicit foreign_keys
    applicant = relationship("User", foreign_keys=[user_id], back_populates="applications")
    job = relationship("Job", foreign_keys=[job_id], back_populates="applications")
