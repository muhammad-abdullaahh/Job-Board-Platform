from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.models.application import Application, ApplicationStatus
from app.models.job import JobStatus

class ApplicationService:
    def __init__(self, db: Session):
        self.app_repo = ApplicationRepository(db)
        self.job_repo = JobRepository(db)

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

    def get_job_applications(self, job_id: int) -> List[Application]:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job #{job_id} not found."
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

        return self.app_repo.update_status(app, new_status, updater_user_id)
