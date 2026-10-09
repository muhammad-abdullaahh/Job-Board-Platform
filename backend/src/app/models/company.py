# Company Model
# Represents employers and hiring companies in the database.
# Stores company profiles, verification status, and relationships to job listings and owners.

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.database import Base
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

if TYPE_CHECKING:
    from app.models.job import Job

class Company(Base):
    __tablename__ = "companies"

    company_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Verification Metadata Fields for Admin Audit
    employee_count: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hr_contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cro_linkedin: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    verified_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    deleted_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    # Relationships
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="company", cascade="all, delete-orphan")
