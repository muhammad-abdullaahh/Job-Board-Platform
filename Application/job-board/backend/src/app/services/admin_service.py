# Administrator Service
# Coordinates platform moderation, analytics reporting, and system management.
# Handles company approvals, user suspension, role management, and audit listings.

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, or_
from app.models.user import User
from app.models.company import Company
from app.models.job import Job, JobStatus
from app.models.application import Application, ApplicationStatus
from app.exceptions import JobNotFoundException

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_analytics(self) -> Dict[str, Any]:
        # Users metrics
        total_users = self.db.query(func.count(User.user_id)).filter(User.deleted_at.is_(None)).scalar() or 0
        admin_users = self.db.query(func.count(User.user_id)).filter(User.deleted_at.is_(None), User.is_admin == True).scalar() or 0
        standard_users = total_users - admin_users
        suspended_users = self.db.query(func.count(User.user_id)).filter(User.deleted_at.is_not(None)).scalar() or 0

        # Companies metrics
        total_companies = self.db.query(func.count(Company.company_id)).filter(Company.deleted_at.is_(None)).scalar() or 0
        verified_companies = self.db.query(func.count(Company.company_id)).filter(Company.deleted_at.is_(None), Company.is_verified == True).scalar() or 0
        pending_companies = total_companies - verified_companies

        # Jobs metrics
        total_jobs = self.db.query(func.count(Job.job_id)).filter(Job.deleted_at.is_(None)).scalar() or 0
        active_jobs = self.db.query(func.count(Job.job_id)).filter(Job.deleted_at.is_(None), Job.status == JobStatus.open).scalar() or 0

        # Applications metrics
        total_applications = self.db.query(func.count(Application.application_id)).filter(Application.deleted_at.is_(None)).scalar() or 0
        hired_or_accepted = self.db.query(func.count(Application.application_id)).filter(
            Application.deleted_at.is_(None),
            Application.status.in_([ApplicationStatus.hired, ApplicationStatus.offer_accepted])
        ).scalar() or 0
        offers_issued = self.db.query(func.count(Application.application_id)).filter(
            Application.deleted_at.is_(None),
            Application.status == ApplicationStatus.offer_issued
        ).scalar() or 0

        # Applications status breakdown
        app_status_rows = (
            self.db.query(Application.status, func.count(Application.application_id))
            .filter(Application.deleted_at.is_(None))
            .group_by(Application.status)
            .all()
        )
        status_breakdown = {
            (status.value if hasattr(status, "value") else str(status)): count
            for status, count in app_status_rows
        }

        # Jobs by employment type breakdown
        job_type_rows = (
            self.db.query(Job.employment_type, func.count(Job.job_id))
            .filter(Job.deleted_at.is_(None))
            .group_by(Job.employment_type)
            .all()
        )
        employment_type_breakdown = {
            (emp_type.value if hasattr(emp_type, "value") else str(emp_type)): count
            for emp_type, count in job_type_rows
        }

        return {
            "users": {
                "total": total_users,
                "admins": admin_users,
                "candidates": standard_users,
                "suspended": suspended_users,
            },
            "companies": {
                "total": total_companies,
                "verified": verified_companies,
                "pending": pending_companies,
            },
            "jobs": {
                "total": total_jobs,
                "active": active_jobs,
                "employment_types": employment_type_breakdown,
            },
            "applications": {
                "total": total_applications,
                "hired_or_accepted": hired_or_accepted,
                "offers_issued": offers_issued,
                "status_breakdown": status_breakdown,
            },
        }

    def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        query: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> List[Job]:
        q = (
            self.db.query(Job)
            .options(
                joinedload(Job.company),
                selectinload(Job.skills)
            )
            .filter(Job.deleted_at.is_(None))
        )
        if status:
            q = q.filter(Job.status == status)
        if query:
            search_pattern = f"%{query}%"
            q = q.join(Job.company, isouter=True).filter(
                or_(
                    Job.title.ilike(search_pattern),
                    Job.location.ilike(search_pattern),
                    Company.name.ilike(search_pattern)
                )
            )
        return q.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    def update_job_status(self, job_id: int, new_status: JobStatus, admin_user_id: int) -> Job:
        job = self.db.query(Job).filter(Job.job_id == job_id, Job.deleted_at.is_(None)).first()
        if not job:
            raise JobNotFoundException(job_id)

        job.status = new_status
        job.updated_by = admin_user_id
        job.updated_at = datetime.now(timezone.utc)
        try:
            self.db.commit()
            self.db.refresh(job)
            return job
        except Exception:
            self.db.rollback()
            raise

    def delete_job(self, job_id: int, admin_user_id: int) -> None:
        """Atomic transaction: soft delete job and cascade soft-delete to its applications."""
        job = self.db.query(Job).filter(Job.job_id == job_id, Job.deleted_at.is_(None)).first()
        if not job:
            raise JobNotFoundException(job_id)

        now = datetime.now(timezone.utc)
        try:
            job.deleted_at = now
            job.deleted_by = admin_user_id

            self.db.query(Application).filter(
                Application.job_id == job_id,
                Application.deleted_at.is_(None)
            ).update({"deleted_at": now}, synchronize_session=False)

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
