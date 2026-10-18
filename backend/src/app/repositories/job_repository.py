# Job Repository
# Performs database operations for creating, updating, and querying job listings.
# Supports full-text search, filtering by skills or location, and status updates.

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import text, func, or_, and_
from app.models.job import Job, JobStatus, EmploymentType
from app.models.skill import Skill
from app.models.company import Company
from app.models.user import User

class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def _apply_public_job_filter(self, query):
        """
        Shared visibility filter for all public job queries.
        Excludes jobs whose company is unverified, soft-deleted,
        or whose owner is locked or soft-deleted.
        A company with no owner is treated as having a valid owner.
        """
        owner_id_col = func.coalesce(Company.created_by, Company.updated_by)
        return (
            query
            .join(Company, Job.company_id == Company.company_id)
            .outerjoin(User, owner_id_col == User.user_id)
            .filter(
                Job.deleted_at.is_(None),
                Company.deleted_at.is_(None),
                Company.is_verified == True,
                or_(
                    owner_id_col.is_(None),
                    and_(
                        User.user_id.is_not(None),
                        User.deleted_at.is_(None),
                        User.is_active == True,
                    ),
                ),
            )
        )

    def get_by_id(self, job_id: int) -> Optional[Job]:
        query = (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
            .filter(
                Job.job_id == job_id
            )
        )
        return self._apply_public_job_filter(query).first()

    def get_any_by_id(self, job_id: int) -> Optional[Job]:
        return (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
            .filter(Job.job_id == job_id)
            .first()
        )

    def get_by_id_and_company(self, job_id: int, company_id: int) -> Optional[Job]:
        return (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
            .filter(
                Job.job_id == job_id,
                Job.company_id == company_id,
                Job.deleted_at.is_(None)
            )
            .first()
        )

    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        employment_type: Optional[EmploymentType] = None,
        status: Optional[JobStatus] = JobStatus.open,
        min_salary: Optional[int] = None,
        company_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
        sort: Optional[str] = None,
        sort_by: Optional[str] = "created_at",
        order: Optional[str] = "desc"
    ) -> List[Job]:
        """
        Public job search and listing, strictly enforcing the shared public visibility filter.
        """
        q = (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
        )
        q = self._apply_public_job_filter(q)

        if status:
            q = q.filter(Job.status == status)

        if company_id:
            q = q.filter(Job.company_id == company_id)

        if employment_type:
            q = q.filter(Job.employment_type == employment_type)

        if location:
            q = q.filter(func.lower(Job.location).like(f"%{location.lower()}%"))

        if min_salary is not None:
            q = q.filter(Job.salary_max >= min_salary)

        if query:
            pattern = f"%{query}%"
            q = q.filter(
                or_(
                    Job.title.ilike(pattern),
                    Job.description.ilike(pattern)
                )
            )

        # Determine sorting column and direction
        sort_col = "created_at"
        desc = True

        if sort:
            clean_sort = sort.strip()
            if clean_sort.startswith("-"):
                sort_col = clean_sort[1:]
                desc = True
            elif clean_sort.startswith("+"):
                sort_col = clean_sort[1:]
                desc = False
            else:
                sort_col = clean_sort
                desc = False
        elif sort_by:
            sort_col = sort_by
            desc = False if order and order.lower() == "asc" else True

        allowed_sort_fields = {
            "created_at": Job.created_at,
            "salary_max": Job.salary_max,
            "salary_min": Job.salary_min,
            "title": Job.title,
            "salary": Job.salary_max,
        }
        col_expr = allowed_sort_fields.get(sort_col, Job.created_at)
        if desc:
            q = q.order_by(col_expr.desc(), Job.job_id.desc())
        else:
            q = q.order_by(col_expr.asc(), Job.job_id.asc())

        return q.offset(skip).limit(limit).all()

    def list_jobs_admin(
        self,
        status: Optional[JobStatus] = None,
        company_id: Optional[int] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        sort: Optional[str] = "-created_at"
    ) -> List[Job]:
        """
        Administrative job listing query: displays all jobs matching admin criteria.
        """
        query = (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
            .filter(Job.deleted_at.is_(None))
        )

        if status:
            query = query.filter(Job.status == status)

        if company_id:
            query = query.filter(Job.company_id == company_id)

        if q:
            pattern = f"%{q.strip()}%"
            query = query.join(Job.company, isouter=True).filter(
                or_(
                    Job.title.ilike(pattern),
                    Job.location.ilike(pattern),
                    Company.name.ilike(pattern)
                )
            )

        sort_col = "created_at"
        desc = True
        if sort:
            clean_sort = sort.strip()
            if clean_sort.startswith("-"):
                sort_col = clean_sort[1:]
                desc = True
            elif clean_sort.startswith("+"):
                sort_col = clean_sort[1:]
                desc = False
            else:
                sort_col = clean_sort
                desc = False

        allowed_cols = {
            "created_at": Job.created_at,
            "title": Job.title,
            "job_id": Job.job_id,
            "salary_min": Job.salary_min,
            "salary_max": Job.salary_max,
        }
        col_expr = allowed_cols.get(sort_col, Job.created_at)
        if desc:
            query = query.order_by(col_expr.desc(), Job.job_id.desc())
        else:
            query = query.order_by(col_expr.asc(), Job.job_id.asc())

        return query.offset(skip).limit(limit).all()


    def create(self, job_in, user_id: Optional[int] = None) -> Job:
        job = Job(
            title=job_in.title,
            description=job_in.description,
            company_id=job_in.company_id,
            location=job_in.location,
            salary_min=job_in.salary_min,
            salary_max=job_in.salary_max,
            employment_type=job_in.employment_type,
            status=job_in.status or JobStatus.open,
            created_by=user_id,
        )

        if hasattr(job_in, 'skill_ids') and job_in.skill_ids:
            skills = self.db.query(Skill).filter(Skill.skill_id.in_(job_in.skill_ids)).all()
            job.skills = skills

        try:
            self.db.add(job)
            self.db.commit()
            return self.get_by_id(job.job_id) or job
        except Exception:
            self.db.rollback()
            raise

    def update(self, job: Job, job_in, user_id: Optional[int] = None) -> Job:
        update_data = job_in.model_dump(exclude_unset=True)
        skill_ids = update_data.pop('skill_ids', None)

        for field, value in update_data.items():
            setattr(job, field, value)

        if skill_ids is not None:
            skills = self.db.query(Skill).filter(Skill.skill_id.in_(skill_ids)).all()
            job.skills = skills

        if user_id:
            job.updated_by = user_id

        try:
            self.db.commit()
            return self.get_by_id(job.job_id) or job
        except Exception:
            self.db.rollback()
            raise

    def soft_delete(self, job: Job, deleted_by_user_id: int, commit: bool = True) -> Job:
        now = datetime.now(timezone.utc)
        try:
            job.deleted_at = now
            job.deleted_by = deleted_by_user_id

            # Cascade soft-delete to applications for this job
            from app.models.application import Application
            self.db.query(Application).filter(
                Application.job_id == job.job_id,
                Application.deleted_at.is_(None)
            ).update({"deleted_at": now}, synchronize_session=False)

            if commit:
                self.db.commit()
                self.db.refresh(job)
            else:
                self.db.flush()
            return job
        except Exception:
            if commit:
                self.db.rollback()
            raise

    def hard_delete(self, job: Job) -> None:
        try:
            self.db.delete(job)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
