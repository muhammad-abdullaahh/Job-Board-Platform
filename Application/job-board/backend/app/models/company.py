from app.database import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship


class Company(Base):
    __tablename__ = "companies"

    # TODO: Define columns:
    # company_id, name, description, website, location,
    # is_verified (Boolean, default False),
    # verified_by (FK -> users.user_id, nullable),
    # created_at, updated_at,
    # updated_by (FK -> users.user_id, nullable),
    # deleted_at,
    # deleted_by (FK -> users.user_id, nullable)
    pass

    # TODO: Define relationships:
    # - jobs (one-to-many)
    # - verifier_user (User, FK verified_by)
    # - updater_user (User, FK updated_by)
    # - deleter_user (User, FK deleted_by)
