from app.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship


# TODO: Define junction table user_skills
# Columns: user_id (FK -> users.user_id), skill_id (FK -> skills.skill_id)
user_skills = None  # Replace with Table(...)

# TODO: Define junction table job_skills
# Columns: job_id (FK -> jobs.job_id), skill_id (FK -> skills.skill_id)
job_skills = None  # Replace with Table(...)


class Skill(Base):
    __tablename__ = "skills"

    # TODO: Define columns:
    # skill_id, name (unique),
    # created_at,
    # created_by (FK -> users.user_id, nullable),  ← now points to users, not admins
    # updated_at
    pass

    # TODO: Define relationships:
    # - creator_user (User, FK created_by)
    # - users (many-to-many via user_skills)
    # - jobs (many-to-many via job_skills)
