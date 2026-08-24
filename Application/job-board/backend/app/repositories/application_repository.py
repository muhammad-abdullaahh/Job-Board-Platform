from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.application import Application, ApplicationStatus
from app.schemas.application_schema import ApplicationCreate, ApplicationStatusUpdate


class ApplicationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, application_id: int) -> Optional[Application]:
        return self.db.query(Application).filter(
            Application.application_id == application_id,
            Application.deleted_at.is_(None)
        ).first()

    def get_user_application_for_job(self, user_id: int, job_id: int) -> Optional[Application]:
        return self.db.query(Application).filter(
            Application.user_id == user_id,
            Application.job_id == job_id,
            Application.deleted_at.is_(None)
        ).first()

    def get_user_applications(self, user_id: int) -> List[Application]:
        return self.db.query(Application).filter(
            Application.user_id == user_id,
            Application.deleted_at.is_(None)
        ).order_by(Application.created_at.desc()).all()

    def get_job_applications(self, job_id: int) -> List[Application]:
        return self.db.query(Application).filter(
            Application.job_id == job_id,
            Application.deleted_at.is_(None)
        ).order_by(Application.created_at.desc()).all()

    def create(self, user_id: int, app_in: ApplicationCreate) -> Application:
        application = Application(
            user_id=user_id,
            job_id=app_in.job_id,
            cover_letter=app_in.cover_letter,
            status=ApplicationStatus.pending
        )
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        return application

    def update_status(self, application: Application, status: ApplicationStatus, updater_user_id: Optional[int] = None) -> Application:
        application.status = status
        if updater_user_id:
            application.updated_by = updater_user_id
        self.db.commit()
        self.db.refresh(application)
        return application
