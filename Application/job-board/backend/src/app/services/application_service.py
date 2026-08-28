from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.models.application import Application, ApplicationStatus
from app.models.job import JobStatus

from app.repositories.user_repository import UserRepository

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
        self.app_repo = ApplicationRepository(db)
        self.job_repo = JobRepository(db)
        self.user_repo = UserRepository(db)

    def apply_to_job(self, user_id: int, app_in) -> Application:
        job = self.job_repo.get_by_id(app_in.job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job #{app_in.job_id} not found."
            )

        if job.status != JobStatus.open:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Applications are closed for this position."
            )

        existing = self.app_repo.get_user_application_for_job(user_id, app_in.job_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted an application for this job."
            )

        return self.app_repo.create(user_id, app_in)

    def get_my_applications(self, user_id: int) -> List[Application]:
        return self.app_repo.get_user_applications(user_id)

    def get_job_applications(self, job_id: int, requesting_user_id: int) -> List[Application]:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job #{job_id} not found."
            )

        user = self.user_repo.get_user_by_id(requesting_user_id)
        is_admin = user.is_admin if user else False
        is_company_owner = job.company and job.company.updated_by == requesting_user_id

        if not is_admin and not is_company_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only the employer who posted this job can view applicant details."
            )

        return self.app_repo.get_job_applications(job_id)

    def update_application_status(
        self,
        application_id: int,
        new_status: ApplicationStatus,
        updater_user_id: int
    ) -> Application:
        app = self.app_repo.get_by_id(application_id)
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Application #{application_id} not found."
            )

        user = self.user_repo.get_user_by_id(updater_user_id)
        is_admin = user.is_admin if user else False
        is_applicant = app.user_id == updater_user_id
        is_company_owner = app.job and app.job.company and app.job.company.updated_by == updater_user_id

        # 1. State machine transition path check
        if new_status != app.status:
            allowed = VALID_TRANSITIONS.get(app.status, set())
            if new_status not in allowed and not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status transition from '{app.status.value}' to '{new_status.value}'."
                )

        # 2. Candidate offer response authorization
        if new_status in [ApplicationStatus.offer_accepted, ApplicationStatus.offer_declined]:
            if not is_applicant and not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Only the applicant candidate can respond to this job offer."
                )

        # 3. Employer candidate evaluation authorization
        else:
            if not is_company_owner and not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Only the hiring employer who posted this job can manage candidate application statuses."
                )

        return self.app_repo.update_status(app, new_status, updater_user_id)
