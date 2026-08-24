from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    verified_by = Column(Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True, onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True)

    # Relationships
    verifier_admin = relationship("Admin", foreign_keys=[verified_by], back_populates="verified_companies")
    updater_admin = relationship("Admin", foreign_keys=[updated_by], back_populates="updated_companies")
    deleter_admin = relationship("Admin", foreign_keys=[deleted_by], back_populates="deleted_companies")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
