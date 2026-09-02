from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database import get_db
from app.dependencies.roles import require_admin
from app.models.user import User
from app.models.company import Company
from app.models.job import Job, JobStatus, EmploymentType
from app.models.application import Application, ApplicationStatus
from app.schemas.job_schema import JobResponse, AdminJobStatusUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
) -> Dict[str, Any]:
    # Users metrics
    total_users = db.query(func.count(User.user_id)).filter(User.deleted_at.is_(None)).scalar() or 0
    admin_users = db.query(func.count(User.user_id)).filter(User.deleted_at.is_(None), User.is_admin == True).scalar() or 0
    standard_users = total_users - admin_users

    # Companies metrics
    total_companies = db.query(func.count(Company.company_id)).filter(Company.deleted_at.is_(None)).scalar() or 0
    verified_companies = db.query(func.count(Company.company_id)).filter(Company.deleted_at.is_(None), Company.is_verified == True).scalar() or 0
    pending_companies = total_companies - verified_companies

    # Jobs metrics
    total_jobs = db.query(func.count(Job.job_id)).filter(Job.deleted_at.is_(None)).scalar() or 0
    active_jobs = db.query(func.count(Job.job_id)).filter(Job.deleted_at.is_(None), Job.status == JobStatus.open).scalar() or 0

    # Applications metrics
    total_applications = db.query(func.count(Application.application_id)).filter(Application.deleted_at.is_(None)).scalar() or 0
    hired_or_accepted = db.query(func.count(Application.application_id)).filter(
        Application.deleted_at.is_(None),
        Application.status.in_([ApplicationStatus.hired, ApplicationStatus.offer_accepted])
    ).scalar() or 0
    offers_issued = db.query(func.count(Application.application_id)).filter(
        Application.deleted_at.is_(None),
        Application.status == ApplicationStatus.offer_issued
    ).scalar() or 0

    # Applications status breakdown
    app_status_rows = (
        db.query(Application.status, func.count(Application.application_id))
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
        db.query(Job.employment_type, func.count(Job.job_id))
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

@router.get("/jobs", response_model=List[JobResponse])
def get_all_jobs_admin(
    status: Optional[JobStatus] = Query(None, description="Filter by job status (open, closed, draft)"),
    q: Optional[str] = Query(None, description="Search by title, location, or company name"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(Job).filter(Job.deleted_at.is_(None))
    if status:
        query = query.filter(Job.status == status)
    if q:
        search_pattern = f"%{q}%"
        query = query.join(Job.company, isouter=True).filter(
            or_(
                Job.title.ilike(search_pattern),
                Job.location.ilike(search_pattern),
                Company.name.ilike(search_pattern)
            )
        )
    return query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

@router.patch("/jobs/{job_id}/status", response_model=JobResponse)
def update_job_status_admin(
    job_id: int,
    status_in: AdminJobStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    job = db.query(Job).filter(Job.job_id == job_id, Job.deleted_at.is_(None)).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job #{job_id} not found."
        )
    job.status = status_in.status
    job.updated_by = admin.user_id
    db.commit()
    db.refresh(job)
    return job

@router.delete("/jobs/{job_id}", status_code=status.HTTP_200_OK)
def delete_job_admin(
    job_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    job = db.query(Job).filter(Job.job_id == job_id, Job.deleted_at.is_(None)).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job #{job_id} not found."
        )
    now = datetime.now(timezone.utc)
    job.deleted_at = now
    job.deleted_by = admin.user_id

    # Cascade soft delete to applications for this job
    db.query(Application).filter(
        Application.job_id == job_id,
        Application.deleted_at.is_(None)
    ).update({"deleted_at": now}, synchronize_session=False)

    db.commit()
    return {"message": f"Job #{job_id} ('{job.title}') deleted successfully by administrator."}
