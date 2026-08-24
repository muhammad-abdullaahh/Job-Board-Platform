from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    deleted_users = relationship("User", foreign_keys="User.deleted_by", back_populates="deleter_admin")
    verified_companies = relationship("Company", foreign_keys="Company.verified_by", back_populates="verifier_admin")
    updated_companies = relationship("Company", foreign_keys="Company.updated_by", back_populates="updater_admin")
    deleted_companies = relationship("Company", foreign_keys="Company.deleted_by", back_populates="deleter_admin")
    created_skills = relationship("Skill", foreign_keys="Skill.created_by", back_populates="creator_admin")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    years_of_experience = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True, onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(Integer, ForeignKey("admins.admin_id", ondelete="SET NULL"), nullable=True)

    # Relationships
    deleter_admin = relationship("Admin", foreign_keys=[deleted_by], back_populates="deleted_users")
    skills = relationship("Skill", secondary="user_skills", back_populates="users")
    applications = relationship("Application", foreign_keys="Application.user_id", back_populates="applicant")
    updated_jobs = relationship("Job", foreign_keys="Job.updated_by", back_populates="updater_user")
    deleted_jobs = relationship("Job", foreign_keys="Job.deleted_by", back_populates="deleter_user")
