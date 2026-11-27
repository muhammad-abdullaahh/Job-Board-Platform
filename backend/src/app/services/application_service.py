# Job Application Service
# Manages the candidate application workflow from submission to decision.
# Handles applicant qualification checks, employer reviews, and automated offer deadlines.

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
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
    CompanyNotVerifiedException,
    AccountLockedException,
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

    # =========================================================================
    # REFACTORED WORKFLOW: APPLY TO JOB
    # Refactoring techniques applied: Composing Methods, Extract Method, Decomposing Conditionals
    # =========================================================================
    def apply_to_job(self, user_id: int, app_in) -> Application:
        """
        Submits a candidate application after validating job eligibility,
        employer account health, and duplicate submission constraints.
        """
        job = self._get_and_validate_job(app_in.job_id)
        self._validate_employer_active(job)
        self._check_duplicate_application(user_id, app_in.job_id)

        try:
            return self.app_repo.create(user_id, app_in)
        except IntegrityError:
            self.db.rollback()
            raise DuplicateApplicationException()

    def _get_and_validate_job(self, job_id: int):
        """Ensures the job exists, is active/open, and belongs to a verified company."""
        job = self.job_repo.get_any_by_id(job_id)
        if not job or job.deleted_at is not None:
            raise JobNotFoundException(job_id)

        if not job.company or not job.company.is_verified or job.company.deleted_at is not None:
            raise CompanyNotVerifiedException("Cannot apply to a job from an unverified or inactive company.")

        if job.status != JobStatus.open:
            raise JobNotOpenException()

        return job

    def _validate_employer_active(self, job):
        """Ensures the company owner account is active and not locked or deleted."""
        owner_id = job.company.created_by if job.company.created_by is not None else job.company.updated_by
        if owner_id:
            owner = self.user_repo.get_user_by_id(owner_id, include_deleted=True)
            if not owner or not owner.is_active or owner.deleted_at is not None:
                raise AccountLockedException("Cannot apply to a job from a locked employer account.")

    def _check_duplicate_application(self, user_id: int, job_id: int):
        """Prevents candidate duplicate applications for the same job vacancy."""
        existing = self.app_repo.get_user_application_for_job(user_id, job_id)
        if existing:
            raise DuplicateApplicationException()

    # =========================================================================
    # APPLICATION QUERY METHODS
    # =========================================================================
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
        is_company_owner = self._is_company_owner(job, requesting_user_id)

        if not is_admin and not is_company_owner:
            raise ForbiddenException("Access denied. Only the employer who posted this job can view applicant details.")

        return self.app_repo.get_job_applications(
            job_id=job_id,
            status=status,
            skip=skip,
            limit=limit,
            sort=sort
        )

    # =========================================================================
    # REFACTORED WORKFLOW: UPDATE APPLICATION STATUS
    # Refactoring techniques applied: Extract Method, Decomposing Conditionals, Atomic Transaction Encapsulation
    # =========================================================================
    def update_application_status(
        self,
        application_id: int,
        new_status: ApplicationStatus,
        updater_user_id: int
    ) -> Application:
        """
        Updates the application status lifecycle following domain transition rules
        and user role authorizations.
        """
        app = self.app_repo.get_by_id(application_id)
        if not app:
            raise ApplicationNotFoundException(application_id)

        user = self.user_repo.get_user_by_id(updater_user_id)
        is_admin = user.is_admin if user else False
        is_applicant = (app.user_id == updater_user_id)
        is_company_owner = self._is_company_owner(app.job, updater_user_id)

        # 1. Validate state machine path
        self._validate_status_transition(app.status, new_status, is_admin)

        # 2. Authorize actor permission
        self._authorize_status_update(new_status, is_applicant, is_company_owner, is_admin)

        # 3. Handle candidate offer acceptance multi-write workflow
        if new_status == ApplicationStatus.offer_accepted:
            return self._execute_offer_acceptance(app, new_status, updater_user_id)

        return self.app_repo.update_status(app, new_status, updater_user_id, commit=True)

    def _is_company_owner(self, job, user_id: int) -> bool:
        """Checks if the user is the registered creator or manager of the job's company."""
        if not job or not job.company:
            return False
        return (
            (job.company.created_by == user_id) or
            (job.company.created_by is None and job.company.updated_by == user_id)
        )

    def _validate_status_transition(
        self,
        current_status: ApplicationStatus,
        new_status: ApplicationStatus,
        is_admin: bool
    ):
        """Enforces domain lifecycle state transition validity."""
        if new_status != current_status:
            allowed = VALID_TRANSITIONS.get(current_status, set())
            if new_status not in allowed and not is_admin:
                raise InvalidStatusTransitionException(
                    from_status=current_status.value,
                    to_status=new_status.value
                )

    def _authorize_status_update(
        self,
        new_status: ApplicationStatus,
        is_applicant: bool,
        is_company_owner: bool,
        is_admin: bool
    ):
        """Dispatches role authorization based on whether the update is candidate- or employer-driven."""
        candidate_actions = {ApplicationStatus.offer_accepted, ApplicationStatus.offer_declined}
        if new_status in candidate_actions:
            if not is_applicant and not is_admin:
                raise ForbiddenException("Access denied. Only the applicant candidate can respond to this job offer.")
        else:
            if not is_company_owner and not is_admin:
                raise ForbiddenException("Access denied. Only the hiring employer who posted this job can manage candidate application statuses.")

    def _execute_offer_acceptance(
        self,
        app: Application,
        new_status: ApplicationStatus,
        updater_user_id: int
    ) -> Application:
        """Atomically marks offer accepted, closes the job vacancy, and purges stale caches."""
        try:
            self.app_repo.update_status(app, new_status, updater_user_id, commit=False)
            job = self.job_repo.get_any_by_id(app.job_id)
            if job:
                job.status = JobStatus.closed
                job.updated_at = datetime.now(timezone.utc)
                job.updated_by = updater_user_id
            self.db.commit()
            api_cache.clear_prefix("jobs:")
            return self.app_repo.get_by_id(app.application_id) or app
        except Exception:
            self.db.rollback()
            raise
