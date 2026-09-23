# Job Application Service
# Manages the candidate application workflow from submission to decision.
# Handles applicant qualification checks, employer reviews, and automated offer deadlines.

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.user_repository import UserRepository
from app.models.application import Application, ApplicationStatus
from app.models.job import JobStatus
from app.exceptions import (
    ApplicationNotFoundException,
    DuplicateApplicationException,
    JobNotFoundException,
    JobNotOpenException,
    InvalidStatusTransitionException,
    ForbiddenException,
)
from app.utils.cache import api_cache

VALID_TRANSITIONS = {
    ApplicationStatus.pending: {
        ApplicationStatus.reviewed,
        ApplicationStatus.shortlisted,
        ApplicationStatus.rejected,
    },
    ApplicationStatus.reviewed: {
        ApplicationStatus.shortlisted,
        ApplicationStatus.rejected,
    },
    ApplicationStatus.shortlisted: {
        ApplicationStatus.offer_issued,
        ApplicationStatus.rejected,
    },
    ApplicationStatus.offer_issued: {
        ApplicationStatus.offer_accepted,
        ApplicationStatus.offer_declined,
        ApplicationStatus.expired,
        ApplicationStatus.rejected,
    },
    ApplicationStatus.offer_accepted: {
        ApplicationStatus.hired,
        ApplicationStatus.rejected,
    },
}

class ApplicationService:
    def __init__(self, db: Session):
        self.db = db
        self.app_repo = ApplicationRepository(db)
        self.job_repo = JobRepository(db)
        self.user_repo = UserRepository(db)

    def apply_to_job(self, user_id: int, app_in) -> Application:
        job = self.job_repo.get_by_id(app_in.job_id)
        if not job:
            raise JobNotFoundException(app_in.job_id)

        if job.status != JobStatus.open:
            raise JobNotOpenException()

        existing = self.app_repo.get_user_application_for_job(user_id, app_in.job_id)
        if existing:
            raise DuplicateApplicationException()

        return self.app_repo.create(user_id, app_in)

    def get_my_applications(
        self,
        user_id: int,
        status: Optional[ApplicationStatus] = None,
        skip: int = 0,
        limit: int = 20,
        sort: str = "-created_at"
    ) -> List[Application]:
        return self.app_repo.get_user_applications(
            user_id=user_id,
            status=status,
            skip=skip,
            limit=limit,
            sort=sort
        )

    def get_job_applications(
        self,
        job_id: int,
        requesting_user_id: int,
        status: Optional[ApplicationStatus] = None,
        skip: int = 0,
        limit: int = 20,
        sort: str = "-created_at"
    ) -> List[Application]:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise JobNotFoundException(job_id)

        user = self.user_repo.get_user_by_id(requesting_user_id)
        is_admin = user.is_admin if user else False
        is_company_owner = job.company and (
            (job.company.created_by == requesting_user_id) or
            (job.company.created_by is None and job.company.updated_by == requesting_user_id)
        )

        if not is_admin and not is_company_owner:
            raise ForbiddenException("Access denied. Only the employer who posted this job can view applicant details.")

        return self.app_repo.get_job_applications(
            job_id=job_id,
            status=status,
            skip=skip,
            limit=limit,
            sort=sort
        )

    def update_application_status(
        self,
        application_id: int,
        new_status: ApplicationStatus,
        updater_user_id: int
    ) -> Application:
        app = self.app_repo.get_by_id(application_id)
        if not app:
            raise ApplicationNotFoundException(application_id)

        user = self.user_repo.get_user_by_id(updater_user_id)
        is_admin = user.is_admin if user else False
        is_applicant = app.user_id == updater_user_id
        is_company_owner = app.job and app.job.company and (
            (app.job.company.created_by == updater_user_id) or
            (app.job.company.created_by is None and app.job.company.updated_by == updater_user_id)
        )

        # 1. State machine transition path check
        if new_status != app.status:
            allowed = VALID_TRANSITIONS.get(app.status, set())
            if new_status not in allowed and not is_admin:
                raise InvalidStatusTransitionException(from_status=app.status.value, to_status=new_status.value)

        # 2. Candidate offer response authorization
        if new_status in [ApplicationStatus.offer_accepted, ApplicationStatus.offer_declined]:
            if not is_applicant and not is_admin:
                raise ForbiddenException("Access denied. Only the applicant candidate can respond to this job offer.")
        # 3. Employer candidate evaluation authorization
        else:
            if not is_company_owner and not is_admin:
                raise ForbiddenException("Access denied. Only the hiring employer who posted this job can manage candidate application statuses.")

        # 4. Handle candidate offer acceptance -> Multi-write atomic transaction (Plan Spec #14)
        if new_status == ApplicationStatus.offer_accepted:
            try:
                updated_app = self.app_repo.update_status(app, new_status, updater_user_id, commit=False)
                job = self.job_repo.get_any_by_id(app.job_id)
                if job:
                    job.status = JobStatus.closed
                    job.updated_at = datetime.now(timezone.utc)
                    job.updated_by = updater_user_id
                self.db.commit()
                self.db.refresh(app)
                if job:
                    self.db.refresh(job)
                api_cache.clear_prefix("jobs:")
                return updated_app
            except Exception:
                self.db.rollback()
                raise

        return self.app_repo.update_status(app, new_status, updater_user_id, commit=True)
