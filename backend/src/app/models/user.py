# User Model
# Defines the database schema and table structure for application users.
# Stores profile data, hashed passwords, administrator status, and skill associations.

from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.database import Base
from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.models.skill import user_skills

if TYPE_CHECKING:
    from app.models.skill import Skill
    from app.models.application import Application
    from app.models.refresh_token import RefreshToken

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    years_experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    @property
    def years_of_experience(self) -> int:
        return self.years_experience or 0

    @years_of_experience.setter
    def years_of_experience(self, val: int):
        self.years_experience = val or 0

    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    deleted_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.user_id"), nullable=True)

    __table_args__ = (
        Index(
            "users_email_active_unique",
            func.lower(email),
            unique=True,
            postgresql_where=(deleted_at.is_(None)),
        ),
        CheckConstraint("years_experience >= 0", name="chk_user_years_experience"),
    )

    # Relationships
    skills: Mapped[List["Skill"]] = relationship("Skill", secondary=user_skills, back_populates="users")
    applications: Mapped[List["Application"]] = relationship("Application", foreign_keys="[Application.user_id]", back_populates="applicant", cascade="all, delete-orphan")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
