from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.roles import require_admin
from app.models.user import User
from app.models.job import JobStatus
from app.services.admin_service import AdminService
from app.schemas.job_schema import JobResponse, AdminJobStatusUpdate
from app.utils.cache import api_cache

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
) -> Dict[str, Any]:
    service = AdminService(db)
    return service.get_analytics()

@router.get("/jobs", response_model=List[JobResponse])
def get_all_jobs_admin(
    status: Optional[JobStatus] = Query(None, description="Filter by job status (open, closed, draft)"),
    q: Optional[str] = Query(None, description="Search by title, location, or company name"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    return service.list_jobs(status=status, query=q, skip=skip, limit=limit)

@router.patch("/jobs/{job_id}/status", response_model=JobResponse)
def update_job_status_admin(
    job_id: int,
    status_in: AdminJobStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    job = service.update_job_status(job_id=job_id, new_status=status_in.status, admin_user_id=admin.user_id)
    api_cache.clear_prefix("jobs:")
    return job

@router.delete("/jobs/{job_id}", status_code=status.HTTP_200_OK)
def delete_job_admin(
    job_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = AdminService(db)
    service.delete_job(job_id=job_id, admin_user_id=admin.user_id)
    api_cache.clear_prefix("jobs:")
    return {"message": f"Job #{job_id} deleted successfully by administrator."}
