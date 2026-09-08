from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.user import User
from app.models.company import Company
from app.models.job import Job
from app.models.application import Application
from app.core.security import get_password_hash

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str, include_deleted: bool = False) -> Optional[User]:
        query = self.db.query(User).filter(User.email == email)
        if not include_deleted:
            query = query.filter(User.deleted_at.is_(None))
        return query.first()

    def get_user_by_id(self, user_id: int, include_deleted: bool = False) -> Optional[User]:
        q = self.db.query(User).filter(User.user_id == user_id)
        if not include_deleted:
            q = q.filter(User.deleted_at.is_(None))
        return q.first()

    def get_all_users(
        self,
        include_deleted: bool = True,
        skip: int = 0,
        limit: int = 100,
        q: Optional[str] = None,
        is_admin: Optional[bool] = None
    ) -> List[User]:
        query = self.db.query(User)
        if not include_deleted:
            query = query.filter(User.deleted_at.is_(None))
        if is_admin is not None:
            query = query.filter(User.is_admin == is_admin)
        if q:
            pattern = f"%{q.strip()}%"
            query = query.filter(or_(User.name.ilike(pattern), User.email.ilike(pattern)))
        return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    def create_user(self, user_in, is_admin: bool = False) -> User:
        hashed_pw = get_password_hash(user_in.password)
        user = User(
            name=user_in.name,
            email=user_in.email,
            password=hashed_pw,
            is_admin=is_admin,
            bio=getattr(user_in, 'bio', None),
            years_experience=getattr(user_in, 'years_of_experience', None) or getattr(user_in, 'years_experience', 0) or 0,
        )
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise

    def update_user(self, user: User, user_in) -> User:
        update_data = user_in.dict(exclude_unset=True)

        if 'years_of_experience' in update_data:
            user.years_experience = update_data.pop('years_of_experience') or 0

        update_data.pop('skill_ids', None)

        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)

        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise

    def update_user_password(self, user: User, new_hashed_password: str) -> User:
        user.password = new_hashed_password
        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise

    def soft_delete_user(self, user: User, deleted_by_user_id: Optional[int] = None) -> User:
        now = datetime.now(timezone.utc)
        try:
            user.deleted_at = now
            valid_deleted_by = None
            if deleted_by_user_id:
                deleter_exists = self.db.query(User.user_id).filter(User.user_id == deleted_by_user_id).first()
                if deleter_exists:
                    valid_deleted_by = deleted_by_user_id
            user.deleted_by = valid_deleted_by

            # Cascade soft-delete respectively to associated entities:
            # 1. Applications submitted by this user
            self.db.query(Application).filter(
                Application.user_id == user.user_id,
                Application.deleted_at.is_(None)
            ).update({"deleted_at": now}, synchronize_session=False)

            # 2. Companies owned / created by this user
            owned_companies = self.db.query(Company).filter(
                or_(
                    Company.created_by == user.user_id,
                    and_(Company.created_by.is_(None), Company.updated_by == user.user_id)
                ),
                Company.deleted_at.is_(None)
            ).all()
            company_ids = [c.company_id for c in owned_companies]

            for company in owned_companies:
                company.deleted_at = now
                company.deleted_by = valid_deleted_by

            # 3. Jobs created by this user OR attached to user's companies
            job_filters = [Job.created_by == user.user_id]
            if company_ids:
                job_filters.append(Job.company_id.in_(company_ids))

            owned_jobs = self.db.query(Job).filter(
                or_(*job_filters),
                Job.deleted_at.is_(None)
            ).all()
            job_ids = [j.job_id for j in owned_jobs]

            for job in owned_jobs:
                job.deleted_at = now
                job.deleted_by = valid_deleted_by

            # 4. Applications for jobs owned by this user
            if job_ids:
                self.db.query(Application).filter(
                    Application.job_id.in_(job_ids),
                    Application.deleted_at.is_(None)
                ).update({"deleted_at": now}, synchronize_session=False)

            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise

    def restore_user(self, user: User) -> User:
        try:
            user.deleted_at = None
            user.deleted_by = None

            # Restore companies owned by this user
            owned_companies = self.db.query(Company).filter(
                or_(
                    Company.created_by == user.user_id,
                    and_(Company.created_by.is_(None), Company.updated_by == user.user_id)
                )
            ).all()
            company_ids = [c.company_id for c in owned_companies]

            for company in owned_companies:
                company.deleted_at = None
                company.deleted_by = None

            # Restore jobs created by this user or under user's companies
            job_filters = [Job.created_by == user.user_id]
            if company_ids:
                job_filters.append(Job.company_id.in_(company_ids))

            owned_jobs = self.db.query(Job).filter(or_(*job_filters)).all()
            job_ids = [j.job_id for j in owned_jobs]

            for job in owned_jobs:
                job.deleted_at = None
                job.deleted_by = None

            # Restore applications submitted by this user
            self.db.query(Application).filter(
                Application.user_id == user.user_id
            ).update({"deleted_at": None}, synchronize_session=False)

            # Restore applications for jobs owned by this user
            if job_ids:
                self.db.query(Application).filter(
                    Application.job_id.in_(job_ids)
                ).update({"deleted_at": None}, synchronize_session=False)

            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise
