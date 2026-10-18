# Administration Routes
# Exposes protected API endpoints for platform administrators and internal CMS clients.
# Provides analytics, companies moderation, user lifecycle management, jobs, applications review, and audit trail.

from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.roles import require_admin
from app.models.user import User
from app.models.job import JobStatus
from app.models.application import ApplicationStatus
from app.services.admin_service import AdminService
from app.services.audit_log_service import AuditLogService

from app.schemas.job_schema import JobResponse, AdminJobStatusUpdate
from app.schemas.company_schema import CompanyResponse
from app.schemas.user_schema import UserResponse, UserLockRequest
from app.schemas.application_schema import ApplicationResponse
from app.schemas.admin_schema import AdminAuditLogResponse
from app.utils.cache import api_cache

router = APIRouter(prefix="/admin", tags=["Admin"])


def _sanitize_actor(actor: Optional[str]) -> Optional[str]:
    if not actor:
        return None
    cleaned = actor.strip()
    return cleaned[:100] if cleaned else None


# =========================================================================
# 1. Platform Analytics
# =========================================================================
@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
) -> Dict[str, Any]:
    service = AdminService(db)
    return service.get_analytics()


# =========================================================================
# 2. Jobs Moderation
# =========================================================================
@router.get("/jobs", response_model=List[JobResponse])
def get_all_jobs_admin(
    status: Optional[JobStatus] = Query(None, description="Filter by job status (open, closed, draft)"),
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    q: Optional[str] = Query(None, description="Search by title, location, or company name"),
    search: Optional[str] = Query(None, description="Alias for q"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, le=100, ge=1, description="Limit for pagination (default 20, max 100)"),
    sort: Optional[str] = Query("-created_at", description="Sort parameter (e.g. -created_at, title)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query_param = q or search
    service = AdminService(db)
    return service.list_jobs(
        status=status,
        company_id=company_id,
        query=query_param,
        skip=skip,
        limit=limit,
        sort=sort
    )


@router.patch("/jobs/{job_id}/status", response_model=JobResponse)
def update_job_status_admin(
    job_id: int,
    status_in: AdminJobStatusUpdate,
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    job = service.update_job_status(
        job_id=job_id,
        new_status=status_in.status,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("jobs:")
    return job


@router.delete("/jobs/{job_id}", status_code=status.HTTP_200_OK)
def delete_job_admin(
    job_id: int,
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    service.delete_job(
        job_id=job_id,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("jobs:")
    return {"message": f"Job #{job_id} deleted successfully by administrator."}


# =========================================================================
# 3. Companies Management
# =========================================================================
@router.get("/companies", response_model=List[CompanyResponse])
def list_companies_admin(
    is_verified: Optional[bool] = Query(None, description="Filter by company verification status"),
    verified: Optional[bool] = Query(None, description="Alias for is_verified"),
    q: Optional[str] = Query(None, description="Search company by name"),
    search: Optional[str] = Query(None, description="Alias for q"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, le=100, ge=1, description="Limit for pagination (default 20, max 100)"),
    sort: Optional[str] = Query("-created_at", description="Sort parameter (e.g. -created_at, name)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    verified_filter = is_verified if is_verified is not None else verified
    query_param = q or search
    service = AdminService(db)
    return service.list_companies(
        is_verified=verified_filter,
        q=query_param,
        skip=skip,
        limit=limit,
        sort=sort
    )


@router.get("/companies/{company_id}", response_model=CompanyResponse)
def get_company_admin(
    company_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    return service.get_company(company_id)


@router.post("/companies/{company_id}/verify", response_model=CompanyResponse)
def verify_company_admin(
    company_id: int,
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    verified = service.verify_company(
        company_id=company_id,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("companies:")
    api_cache.clear_prefix("jobs:")
    return verified


@router.post("/companies/{company_id}/unverify", response_model=CompanyResponse)
def unverify_company_admin(
    company_id: int,
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    unverified = service.unverify_company(
        company_id=company_id,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("companies:")
    api_cache.clear_prefix("jobs:")
    return unverified


@router.delete("/companies/{company_id}", status_code=status.HTTP_200_OK)
def delete_company_admin(
    company_id: int,
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    service.delete_company(
        company_id=company_id,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("companies:")
    api_cache.clear_prefix("jobs:")
    return {"message": f"Company #{company_id} deleted successfully by administrator."}


# =========================================================================
# 4. Users Management
# =========================================================================
@router.get("/users", response_model=List[UserResponse])
def list_users_admin(
    is_active: Optional[bool] = Query(None, description="Filter active (true) or locked (false) users"),
    active: Optional[bool] = Query(None, description="Alias for is_active"),
    is_admin: Optional[bool] = Query(None, description="Filter by admin privileges"),
    q: Optional[str] = Query(None, description="Search users by name or email"),
    search: Optional[str] = Query(None, description="Alias for q"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, le=100, ge=1, description="Limit for pagination (default 20, max 100)"),
    sort: Optional[str] = Query("-created_at", description="Sort parameter (e.g. -created_at, name, email)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    active_filter = is_active if is_active is not None else active
    query_param = q or search
    service = AdminService(db)
    return service.list_users(
        is_active=active_filter,
        is_admin=is_admin,
        q=query_param,
        skip=skip,
        limit=limit,
        sort=sort
    )


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    return service.get_user(user_id)


@router.post("/users/{user_id}/lock", response_model=UserResponse)
def lock_user_admin(
    user_id: int,
    lock_in: UserLockRequest,
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    locked_user = service.lock_user(
        user_id=user_id,
        reason=lock_in.reason,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("jobs:")
    return locked_user


@router.post("/users/{user_id}/unlock", response_model=UserResponse)
def unlock_user_admin(
    user_id: int,
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    unlocked_user = service.unlock_user(
        user_id=user_id,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("jobs:")
    return unlocked_user


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_admin(
    user_id: int,
    hard: bool = Query(False, description="Set to true for permanent hard-delete (requires user to already be locked or soft-deleted)"),
    x_cms_actor: Optional[str] = Header(None, alias="X-CMS-Actor"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    service.delete_user(
        user_id=user_id,
        hard=hard,
        admin_user_id=admin.user_id,
        actor_label=_sanitize_actor(x_cms_actor)
    )
    api_cache.clear_prefix("jobs:")
    return {"message": f"User #{user_id} {'permanently' if hard else 'soft-'}deleted successfully."}


# =========================================================================
# 5. Applications (Read-Only)
# =========================================================================
@router.get("/applications", response_model=List[ApplicationResponse])
def list_applications_admin(
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status"),
    job_id: Optional[int] = Query(None, description="Filter by job ID"),
    user_id: Optional[int] = Query(None, description="Filter by candidate user ID"),
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    from_date: Optional[datetime] = Query(None, description="Filter applications submitted on or after this ISO 8601 UTC date"),
    to_date: Optional[datetime] = Query(None, description="Filter applications submitted on or before this ISO 8601 UTC date"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, le=100, ge=1, description="Limit for pagination (default 20, max 100)"),
    sort: Optional[str] = Query("-created_at", description="Sort parameter (default newest first: -created_at)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    return service.list_applications(
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


# =========================================================================
# 6. Audit Trail
# =========================================================================
@router.get("/audit-logs", response_model=List[AdminAuditLogResponse])
def get_audit_logs_admin(
    action: Optional[str] = Query(None, description="Filter by action type (e.g. USER_LOCKED, COMPANY_VERIFIED)"),
    target_type: Optional[str] = Query(None, description="Filter by target resource (e.g. user, company, job)"),
    target_id: Optional[int] = Query(None, description="Filter by target resource ID"),
    from_date: Optional[datetime] = Query(None, description="Filter audit logs on or after this ISO 8601 UTC date"),
    to_date: Optional[datetime] = Query(None, description="Filter audit logs on or before this ISO 8601 UTC date"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, le=100, ge=1, description="Limit for pagination (default 20, max 100)"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AuditLogService(db)
    return service.list_logs(
        action=action,
        target_type=target_type,
        target_id=target_id,
        from_date=from_date,
        to_date=to_date,
        skip=skip,
        limit=limit
    )
