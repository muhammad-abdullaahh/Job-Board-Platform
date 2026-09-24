# Job Repository
# Performs database operations for creating, updating, and querying job listings.
# Supports full-text search, filtering by skills or location, and status updates.

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import text
from app.models.job import Job, JobStatus, EmploymentType
from app.models.skill import Skill

class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, job_id: int) -> Optional[Job]:
        return (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
            .filter(
                Job.job_id == job_id,
                Job.deleted_at.is_(None)
            )
            .first()
        )

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
        Multi-field job filtering executed via parameterized Raw SQL (Plan Spec #10).
        Supports single sort parameter (e.g. ?sort=-created_at, ?sort=salary_min) as per Spec #18,
        with backward compatibility for sort_by & order.
        """
        # Determine sorting column and direction
        sort_col = "created_at"
        sort_dir = "DESC"

        if sort:
            clean_sort = sort.strip()
            if clean_sort.startswith("-"):
                sort_col = clean_sort[1:]
                sort_dir = "DESC"
            elif clean_sort.startswith("+"):
                sort_col = clean_sort[1:]
                sort_dir = "ASC"
            else:
                sort_col = clean_sort
                sort_dir = "ASC"
        elif sort_by:
            sort_col = sort_by
            sort_dir = "ASC" if order and order.lower() == "asc" else "DESC"

        allowed_sort_fields = {
            "created_at": "created_at",
            "salary_max": "salary_max",
            "salary_min": "salary_min",
            "title": "title",
            "salary": "salary_max",
        }
        safe_sort_col = allowed_sort_fields.get(sort_col, "created_at")

        # Build parameterized Raw SQL WHERE clause
        conditions = ["deleted_at IS NULL"]
        params: dict = {"limit": limit, "skip": skip}

        if status:
            status_val = status.value if hasattr(status, "value") else str(status)
            conditions.append("status = :status")
            params["status"] = status_val

        if company_id:
            conditions.append("company_id = :company_id")
            params["company_id"] = company_id

        if employment_type:
            emp_val = employment_type.value if hasattr(employment_type, "value") else str(employment_type)
            conditions.append("employment_type = :employment_type")
            params["employment_type"] = emp_val

        if location:
            conditions.append("LOWER(location) LIKE LOWER(:location)")
            params["location"] = f"%{location}%"

        if min_salary is not None:
            conditions.append("salary_max >= :min_salary")
            params["min_salary"] = min_salary

        if query:
            conditions.append("(LOWER(title) LIKE LOWER(:query) OR LOWER(description) LIKE LOWER(:query))")
            params["query"] = f"%{query}%"

        where_sql = " AND ".join(conditions)
        raw_sql = f"""
            SELECT job_id
            FROM jobs
            WHERE {where_sql}
            ORDER BY {safe_sort_col} {sort_dir}
            LIMIT :limit OFFSET :skip
        """

        result = self.db.execute(text(raw_sql), params)
        job_ids = [row[0] for row in result.fetchall()]
        if not job_ids:
            return []

        # Hydrate matching jobs with eager-loaded relations, preserving order
        jobs = (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
            .filter(Job.job_id.in_(job_ids))
            .all()
        )
        job_map = {j.job_id: j for j in jobs}
        return [job_map[jid] for jid in job_ids if jid in job_map]

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
            self.db.refresh(job)
            return job
        except Exception:
            self.db.rollback()
            raise

    def update(self, job: Job, job_in, user_id: Optional[int] = None) -> Job:
        update_data = job_in.dict(exclude_unset=True)
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
            self.db.refresh(job)
            return job
        except Exception:
            self.db.rollback()
            raise

    def soft_delete(self, job: Job, deleted_by_user_id: int) -> Job:
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

            self.db.commit()
            self.db.refresh(job)
            return job
        except Exception:
            self.db.rollback()
            raise

    def hard_delete(self, job: Job) -> None:
        try:
            self.db.delete(job)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
