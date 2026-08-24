from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.models.application import Application, ApplicationStatus
from app.schemas.application_schema import ApplicationCreate


class ApplicationService:
    def __init__(self, db: Session):
        self.app_repo = ApplicationRepository(db)
        self.job_repo = JobRepository(db)

    def apply_to_job(self, user_id: int, app_in: ApplicationCreate) -> Application:
        job = self.job_repo.get_by_id(app_in.job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        if job.status != "open":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot apply to a closed or draft job posting"
            )

        existing = self.app_repo.get_user_application_for_job(user_id, app_in.job_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted an application for this job"
            )

        return self.app_repo.create(user_id, app_in)

    def get_my_applications(self, user_id: int) -> List[Application]:
        return self.app_repo.get_user_applications(user_id)

    def get_job_applications(self, job_id: int) -> List[Application]:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        return self.app_repo.get_job_applications(job_id)

    def update_application_status(self, application_id: int, new_status: ApplicationStatus, updater_user_id: int) -> Application:
        application = self.app_repo.get_by_id(application_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        return self.app_repo.update_status(application, new_status, updater_user_id)
