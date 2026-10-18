# Administrator Service
# Coordinates platform moderation, analytics reporting, system management, and audit tracking.
# Handles company approvals, user lock/unlock, user deletion, application viewing, and audit logs.

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.company import Company
from app.models.job import Job, JobStatus
from app.models.application import Application, ApplicationStatus
from app.models.audit_log import AdminAuditLog

from app.repositories.user_repository import UserRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.job_repository import JobRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.audit_log_repository import AdminAuditLogRepository

from app.exceptions import (
    JobNotFoundException,
    CompanyNotFoundException,
    UserNotFoundException,
    CannotModifySelfException,
    CannotModifyAdminException,
    LockReasonRequiredException,
    AppException,
)

class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.company_repo = CompanyRepository(db)
        self.job_repo = JobRepository(db)
        self.app_repo = ApplicationRepository(db)
        self.token_repo = RefreshTokenRepository(db)
        self.audit_repo = AdminAuditLogRepository(db)

    # ---------------------------------------------------------
    # Analytics
    # ---------------------------------------------------------
    def get_analytics(self) -> Dict[str, Any]:
        total_users = self.db.query(func.count(User.user_id)).filter(User.deleted_at.is_(None)).scalar() or 0
        admin_users = self.db.query(func.count(User.user_id)).filter(User.deleted_at.is_(None), User.is_admin == True).scalar() or 0
        standard_users = total_users - admin_users
        suspended_users = self.db.query(func.count(User.user_id)).filter(User.deleted_at.is_not(None)).scalar() or 0

        total_companies = self.db.query(func.count(Company.company_id)).filter(Company.deleted_at.is_(None)).scalar() or 0
        verified_companies = self.db.query(func.count(Company.company_id)).filter(Company.deleted_at.is_(None), Company.is_verified == True).scalar() or 0
        pending_companies = total_companies - verified_companies

        total_jobs = self.db.query(func.count(Job.job_id)).filter(Job.deleted_at.is_(None)).scalar() or 0
        active_jobs = self.db.query(func.count(Job.job_id)).filter(Job.deleted_at.is_(None), Job.status == JobStatus.open).scalar() or 0

        total_applications = self.db.query(func.count(Application.application_id)).filter(Application.deleted_at.is_(None)).scalar() or 0
        hired_or_accepted = self.db.query(func.count(Application.application_id)).filter(
            Application.deleted_at.is_(None),
            Application.status.in_([ApplicationStatus.hired, ApplicationStatus.offer_accepted])
        ).scalar() or 0
        offers_issued = self.db.query(func.count(Application.application_id)).filter(
            Application.deleted_at.is_(None),
            Application.status == ApplicationStatus.offer_issued
        ).scalar() or 0

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

    # ---------------------------------------------------------
    # Jobs Management
    # ---------------------------------------------------------
    def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        company_id: Optional[int] = None,
        query: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        sort: Optional[str] = "-created_at"
    ) -> List[Job]:
        return self.job_repo.list_jobs_admin(
            status=status,
            company_id=company_id,
            q=query,
            skip=skip,
            limit=limit,
            sort=sort
        )

    def update_job_status(
        self,
        job_id: int,
        new_status: JobStatus,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> Job:
        job = self.job_repo.get_by_id(job_id) or self.job_repo.get_any_by_id(job_id)
        if not job or job.deleted_at is not None:
            raise JobNotFoundException(job_id)

        old_status_val = job.status.value if hasattr(job.status, "value") else str(job.status)
        new_status_val = new_status.value if hasattr(new_status, "value") else str(new_status)

        try:
            job.status = new_status
            job.updated_by = admin_user_id
            job.updated_at = datetime.now(timezone.utc)

            self.audit_repo.create(
                admin_user_id=admin_user_id,
                action="JOB_STATUS_CHANGED",
                target_type="job",
                target_id=job_id,
                details={"old_status": old_status_val, "new_status": new_status_val},
                actor_label=actor_label,
                commit=False
            )
            self.db.commit()
            return job
        except Exception:
            self.db.rollback()
            raise

    def delete_job(
        self,
        job_id: int,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> None:
        """Atomic transaction: soft delete job, cascade soft-delete applications, record audit log."""
        job = self.job_repo.get_any_by_id(job_id)
        if not job or job.deleted_at is not None:
            raise JobNotFoundException(job_id)

        try:
            self.job_repo.soft_delete(job, deleted_by_user_id=admin_user_id, commit=False)

            self.audit_repo.create(
                admin_user_id=admin_user_id,
                action="JOB_DELETED",
                target_type="job",
                target_id=job_id,
                details={"type": "soft"},
                actor_label=actor_label,
                commit=False
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    # ---------------------------------------------------------
    # Companies Management
    # ---------------------------------------------------------
    def list_companies(
        self,
        is_verified: Optional[bool] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        sort: Optional[str] = "-created_at"
    ) -> List[Company]:
        return self.company_repo.list_companies_admin(
            is_verified=is_verified,
            q=q,
            skip=skip,
            limit=limit,
            sort=sort
        )

    def get_company(self, company_id: int) -> Company:
        company = self.company_repo.get_by_id(company_id)
        if not company:
            raise CompanyNotFoundException(company_id)
        return company

    def verify_company(
        self,
        company_id: int,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> Company:
        company = self.get_company(company_id)
        try:
            self.company_repo.verify_company(
                company=company,
                is_verified=True,
                admin_user_id=admin_user_id,
                commit=False
            )
            self.audit_repo.create(
                admin_user_id=admin_user_id,
                action="COMPANY_VERIFIED",
                target_type="company",
                target_id=company_id,
                details={"previous_status": False, "new_status": True},
                actor_label=actor_label,
                commit=False
            )
            self.db.commit()
            self.db.refresh(company)
            return company
        except Exception:
            self.db.rollback()
            raise

    def unverify_company(
        self,
        company_id: int,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> Company:
        company = self.get_company(company_id)
        try:
            self.company_repo.verify_company(
                company=company,
                is_verified=False,
                admin_user_id=admin_user_id,
                commit=False
            )
            self.audit_repo.create(
                admin_user_id=admin_user_id,
                action="COMPANY_UNVERIFIED",
                target_type="company",
                target_id=company_id,
                details={"previous_status": True, "new_status": False},
                actor_label=actor_label,
                commit=False
            )
            self.db.commit()
            self.db.refresh(company)
            return company
        except Exception:
            self.db.rollback()
            raise

    def delete_company(
        self,
        company_id: int,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> None:
        """
        Atomic transaction: soft-delete company, cascade soft-delete jobs & applications,
        and write audit row in one single transaction.
        """
        company = self.get_company(company_id)
        try:
            self.company_repo.soft_delete(
                company=company,
                deleted_by_user_id=admin_user_id,
                commit=False
            )
            self.audit_repo.create(
                admin_user_id=admin_user_id,
                action="COMPANY_DELETED",
                target_type="company",
                target_id=company_id,
                details={"type": "soft"},
                actor_label=actor_label,
                commit=False
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    # ---------------------------------------------------------
    # Users Management
    # ---------------------------------------------------------
    def list_users(
        self,
        is_active: Optional[bool] = None,
        is_admin: Optional[bool] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        sort: Optional[str] = "-created_at"
    ) -> List[User]:
        return self.user_repo.list_users_admin(
            is_active=is_active,
            is_admin=is_admin,
            q=q,
            skip=skip,
            limit=limit,
            sort=sort
        )

    def get_user(self, user_id: int) -> User:
        user = self.user_repo.get_user_by_id(user_id, include_deleted=True)
        if not user:
            raise UserNotFoundException(f"User #{user_id} not found.")
        return user

    def lock_user(
        self,
        user_id: int,
        reason: str,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> User:
        if not reason or not reason.strip():
            raise LockReasonRequiredException()

        user = self.get_user(user_id)

        # Safety Rules
        if user.user_id == admin_user_id:
            raise CannotModifySelfException()
        if user.is_admin:
            raise CannotModifyAdminException()

        try:
            clean_reason = reason.strip()[:500]
            self.user_repo.lock_user(user, reason=clean_reason, commit=False)
            self.token_repo.delete_all_for_user(user.user_id, commit=False)

            self.audit_repo.create(
                admin_user_id=admin_user_id,
                action="USER_LOCKED",
                target_type="user",
                target_id=user.user_id,
                details={"reason": clean_reason},
                actor_label=actor_label,
                commit=False
            )
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise

    def unlock_user(
        self,
        user_id: int,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> User:
        user = self.get_user(user_id)

        # Safety Rules
        if user.user_id == admin_user_id:
            raise CannotModifySelfException()
        if user.is_admin:
            raise CannotModifyAdminException()

        try:
            self.user_repo.unlock_user(user, commit=False)

            self.audit_repo.create(
                admin_user_id=admin_user_id,
                action="USER_UNLOCKED",
                target_type="user",
                target_id=user.user_id,
                details={"previous_status": "locked"},
                actor_label=actor_label,
                commit=False
            )
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise

    def delete_user(
        self,
        user_id: int,
        hard: bool,
        admin_user_id: int,
        actor_label: Optional[str] = None
    ) -> None:
        user = self.get_user(user_id)

        # Safety Rules
        if user.user_id == admin_user_id:
            raise CannotModifySelfException()
        if user.is_admin:
            raise CannotModifyAdminException()

        if not hard:
            try:
                self.user_repo.soft_delete_user(
                    user=user,
                    deleted_by_user_id=admin_user_id,
                    commit=False
                )
                self.audit_repo.create(
                    admin_user_id=admin_user_id,
                    action="USER_DELETED",
                    target_type="user",
                    target_id=user_id,
                    details={"type": "soft"},
                    actor_label=actor_label,
                    commit=False
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise
        else:
            # Permanent hard delete requires user to already be locked or soft-deleted
            if user.is_active is True and user.deleted_at is None:
                raise AppException(
                    status_code=400,
                    error_code="USER_NOT_LOCKED",
                    detail="Cannot permanently delete user: user must be locked or soft-deleted first."
                )

            try:
                self.user_repo.hard_delete_user(user=user, commit=False)
                self.audit_repo.create(
                    admin_user_id=admin_user_id,
                    action="USER_DELETED",
                    target_type="user",
                    target_id=user_id,
                    details={"type": "hard"},
                    actor_label=actor_label,
                    commit=False
                )
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

    # ---------------------------------------------------------
    # Applications (Read-Only)
    # ---------------------------------------------------------
    def list_applications(
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
        return self.app_repo.list_applications_admin(
            status=status,
            job_id=job_id,
            user_id=user_id,
            company_id=company_id,
            from_date=from_date,
            to_date=to_date,
            skip=skip,
            limit=limit,
            sort=sort
        )

    # ---------------------------------------------------------
    # Audit Logs (Read-Only)
    # ---------------------------------------------------------
    def list_audit_logs(
        self,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[AdminAuditLog]:
        return self.audit_repo.list_logs(
            action=action,
            target_type=target_type,
            target_id=target_id,
            from_date=from_date,
            to_date=to_date,
            skip=skip,
            limit=limit
        )
