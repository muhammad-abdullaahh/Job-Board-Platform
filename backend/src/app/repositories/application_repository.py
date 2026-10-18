# Application Repository
# Executes database queries for job applications and candidate submissions.
# Handles application tracking, status updates, interview schedules, and expiration checks.

from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.models.user import User

class ApplicationRepository:
    def __init__(self, db: Session):
        self.db = db

    def _eager_options(self):
        job_load = joinedload(Application.job)
        return [
            job_load.joinedload(Job.company),
            job_load.selectinload(Job.skills),
            joinedload(Application.applicant).selectinload(User.skills),
        ]

    def get_by_id(self, application_id: int) -> Optional[Application]:
        return (
            self.db.query(Application)
            .options(*self._eager_options())
            .filter(
                Application.application_id == application_id,
                Application.deleted_at.is_(None)
            )
            .first()
        )

    def get_user_application_for_job(self, user_id: int, job_id: int) -> Optional[Application]:
        return (
            self.db.query(Application)
            .options(*self._eager_options())
            .filter(
                Application.user_id == user_id,
                Application.job_id == job_id,
                Application.deleted_at.is_(None)
            )
            .first()
        )

    def get_user_applications(
        self,
        user_id: int,
        status: Optional[ApplicationStatus] = None,
        skip: int = 0,
        limit: int = 20,
        sort: str = "-created_at"
    ) -> List[Application]:
        q = (
            self.db.query(Application)
            .options(*self._eager_options())
            .filter(
                Application.user_id == user_id,
                Application.deleted_at.is_(None)
            )
        )
        if status:
            q = q.filter(Application.status == status)

        if sort and sort.strip() == "created_at":
            q = q.order_by(Application.created_at.asc())
        else:
            q = q.order_by(Application.created_at.desc())

        return q.offset(skip).limit(limit).all()

    def get_job_applications(
        self,
        job_id: int,
        status: Optional[ApplicationStatus] = None,
        skip: int = 0,
        limit: int = 20,
        sort: str = "-created_at"
    ) -> List[Application]:
        q = (
            self.db.query(Application)
            .options(*self._eager_options())
            .filter(
                Application.job_id == job_id,
                Application.deleted_at.is_(None)
            )
        )
        if status:
            q = q.filter(Application.status == status)

        if sort and sort.strip() == "created_at":
            q = q.order_by(Application.created_at.asc())
        else:
            q = q.order_by(Application.created_at.desc())

        return q.offset(skip).limit(limit).all()

    def create(self, user_id: int, app_in) -> Application:
        application = Application(
            job_id=app_in.job_id,
            user_id=user_id,
            cover_letter=app_in.cover_letter,
            status=ApplicationStatus.pending,
            created_by=user_id,
        )
        try:
            self.db.add(application)
            self.db.commit()
            return self.get_by_id(application.application_id) or application
        except Exception:
            self.db.rollback()
            raise

    def update_status(
        self,
        application: Application,
        status: ApplicationStatus,
        updater_user_id: Optional[int] = None,
        commit: bool = True
    ) -> Application:
        application.status = status
        if updater_user_id:
            application.updated_by = updater_user_id
        
        # When an offer letter is issued, set both offer_issued_at and the 48-hour expiration timer!
        if status == ApplicationStatus.offer_issued:
            now = datetime.now(timezone.utc)
            application.offer_issued_at = now
            application.offer_expires_at = now + timedelta(hours=48)

        if commit:
            try:
                self.db.commit()
                return self.get_by_id(application.application_id) or application
            except Exception:
                self.db.rollback()
                raise
        else:
            self.db.flush()
            return application

    def list_applications_admin(
        self,
        status: Optional[ApplicationStatus] = None,
        job_id: Optional[int] = None,
        user_id: Optional[int] = None,
        company_id: Optional[int] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
        sort: Optional[str] = "-created_at"
    ) -> List[Application]:
        q = self.db.query(Application).options(*self._eager_options())

        if status:
            q = q.filter(Application.status == status)
        if job_id:
            q = q.filter(Application.job_id == job_id)
        if user_id:
            q = q.filter(Application.user_id == user_id)
        if company_id:
            q = q.join(Job, Application.job_id == Job.job_id).filter(Job.company_id == company_id)
        if from_date:
            q = q.filter(Application.created_at >= from_date)
        if to_date:
            q = q.filter(Application.created_at <= to_date)

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
            "created_at": Application.created_at,
            "application_id": Application.application_id,
            "status": Application.status,
        }
        col_expr = allowed_cols.get(sort_col, Application.created_at)
        if desc:
            q = q.order_by(col_expr.desc(), Application.application_id.desc())
        else:
            q = q.order_by(col_expr.asc(), Application.application_id.asc())

        return q.offset(skip).limit(limit).all()

