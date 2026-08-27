from datetime import datetime, timezone
from app.database import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.skill import user_skills

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    bio = Column(Text, nullable=True)
    years_experience = Column(Integer, default=0, nullable=False)

    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    # Relationships
    skills = relationship("Skill", secondary=user_skills, back_populates="users")
    applications = relationship("Application", foreign_keys="[Application.user_id]", back_populates="applicant", cascade="all, delete-orphan")

