from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.job import Job, JobStatus, EmploymentType
from app.models.skill import Skill

class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, job_id: int) -> Optional[Job]:
        return (
            self.db.query(Job)
            .filter(
                Job.job_id == job_id,
                Job.deleted_at.is_(None)
            )
            .first()
        )

    def get_by_id_and_company(self, job_id: int, company_id: int) -> Optional[Job]:
        return (
            self.db.query(Job)
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
        limit: int = 100
    ) -> List[Job]:
        q = self.db.query(Job).filter(Job.deleted_at.is_(None))

        if status:
            q = q.filter(Job.status == status)
        if company_id:
            q = q.filter(Job.company_id == company_id)
        if employment_type:
            q = q.filter(Job.employment_type == employment_type)
        if location:
            q = q.filter(Job.location.ilike(f"%{location}%"))
        if min_salary is not None:
            q = q.filter(Job.salary_max >= min_salary)
        if query:
            pattern = f"%{query}%"
            q = q.filter(or_(Job.title.ilike(pattern), Job.description.ilike(pattern)))

        return q.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

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

        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

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

        self.db.commit()
        self.db.refresh(job)
        return job

    def soft_delete(self, job: Job, deleted_by_user_id: int) -> Job:
        job.deleted_at = datetime.now(timezone.utc)
        job.deleted_by = deleted_by_user_id
        self.db.commit()
        self.db.refresh(job)
        return job
