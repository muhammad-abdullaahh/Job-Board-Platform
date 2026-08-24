import enum
from app.database import Base
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship


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

    # TODO: Define columns:
    # application_id  - Integer, primary key
    # user_id         - Integer, FK -> users.user_id, not null
    # job_id          - Integer, FK -> jobs.job_id, not null
    # cover_letter    - Text, not null
    # status          - ApplicationStatus enum, not null, default "pending"
    # created_at      - DateTime, not null, default now()
    # updated_at      - DateTime, nullable
    # updated_by      - Integer, FK -> users.user_id, nullable

    # --- Offer letter tracking fields ---
    # offer_issued_at  - DateTime, nullable
    #                    Set when status transitions to "offer_issued"
    # offer_expires_at - DateTime, nullable
    #                    Set to offer_issued_at + 48 hours
    #                    APScheduler checks this to auto-set status to "expired"

    # --- Soft delete ---
    # deleted_at       - DateTime, nullable

    # TODO: Add UniqueConstraint on (user_id, job_id) -> "uq_user_job"
    __table_args__ = ()

    # TODO: Define relationships:
    # - applicant   (User, FK user_id)
    # - job         (Job,  FK job_id)
    # - updater_user (User, FK updated_by)
