from app.database import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    # --- Shared fields (both Admin and User) ---
    # TODO: user_id   - Integer, primary key
    # TODO: name      - String(255), not null
    # TODO: email     - String(255), unique, not null, indexed
    # TODO: password  - String(255), not null
    # TODO: is_admin  - Boolean, not null, default False
    # TODO: created_at - DateTime, not null, default now()

    # --- User-only fields (is_admin=False rows only) ---
    # NOTE: These columns exist in the table for all rows,
    #       but the service layer will never populate them for admins.
    # TODO: bio                 - Text, nullable
    # TODO: years_of_experience - Integer, not null, default 0, check >= 0
    # TODO: updated_at          - DateTime, nullable (auto-set on update)
    # TODO: deleted_at          - DateTime, nullable (soft-delete timestamp)
    # TODO: deleted_by          - Integer, FK -> users.user_id, nullable
    #                             (self-referential: which admin deleted this user)
    pass

    # TODO: Define relationships:
    # - skills (many-to-many via user_skills)
    # - applications (one-to-many)
    # - updated_jobs (FK jobs.updated_by)
    # - deleted_jobs (FK jobs.deleted_by)
    # - verified_companies (FK companies.verified_by)
    # - updated_companies (FK companies.updated_by)
    # - deleted_companies (FK companies.deleted_by)
    # - created_skills (FK skills.created_by)
    # - deleter (self-ref: the admin who deleted this user, FK deleted_by -> user_id)
