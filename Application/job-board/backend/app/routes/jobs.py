from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user_or_admin
from app.services.job_service import JobService
from app.models.job import JobStatus, EmploymentType
from app.schemas.job_schema import JobCreate, JobUpdate, JobResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobResponse])
def search_jobs(
    q: Optional[str] = Query(None, description="Search term for title or description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    employment_type: Optional[EmploymentType] = Query(None, description="Filter by employment type"),
    status: Optional[JobStatus] = Query(JobStatus.open, description="Filter by job status"),
    min_salary: Optional[int] = Query(None, description="Filter by minimum salary"),
    company_id: Optional[int] = Query(None, description="Filter by company"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    service = JobService(db)
    return service.list_jobs(
        query=q,
        location=location,
        employment_type=employment_type,
        status_filter=status,
        min_salary=min_salary,
        company_id=company_id,
        skip=skip,
        limit=limit
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    service = JobService(db)
    return service.get_job(job_id)


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_auth: dict = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    service = JobService(db)
    user_id = current_auth["id"] if current_auth["type"] == "user" else None
    return service.create_job(job_in, user_id=user_id)


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_auth: dict = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    service = JobService(db)
    user_id = current_auth["id"] if current_auth["type"] == "user" else None
    return service.update_job(job_id, job_in, user_id=user_id)
