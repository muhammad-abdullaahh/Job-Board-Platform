from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.job_service import JobService
from app.models.job import JobStatus, EmploymentType
from app.schemas.job_schema import JobCreate, JobUpdate, JobResponse
from app.utils.cache import api_cache

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobResponse])
def search_jobs(
    response: Response,
    q: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    employment_type: Optional[EmploymentType] = Query(None),
    status: Optional[JobStatus] = Query(None),
    min_salary: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    sort_by: Optional[str] = Query("created_at", description="Sort by field (created_at, salary_max, salary_min, title)"),
    order: Optional[str] = Query("desc", description="Sort direction (asc, desc)"),
    db: Session = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=15, stale-while-revalidate=45"
    cache_key = f"jobs:list:{q}:{location}:{employment_type}:{status}:{min_salary}:{company_id}:{skip}:{limit}:{sort_by}:{order}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        return cached

    service = JobService(db)
    raw_jobs = service.list_jobs(
        query=q,
        location=location,
        employment_type=employment_type,
        status_filter=status,
        min_salary=min_salary,
        company_id=company_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        order=order,
    )
    validated = [JobResponse.model_validate(j) for j in raw_jobs]
    api_cache.set(cache_key, validated, ttl=60)
    response.headers["X-Cache"] = "MISS"
    return validated

@router.get("/{job_id}", response_model=JobResponse)
def get_job_detail(job_id: int, response: Response, db: Session = Depends(get_db)):
    cache_key = f"jobs:detail:{job_id}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=60"
        return cached

    service = JobService(db)
    job = service.get_job(job_id)
    validated = JobResponse.model_validate(job)
    api_cache.set(cache_key, validated, ttl=120)
    response.headers["X-Cache"] = "MISS"
    response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=60"
    return validated

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = JobService(db)
    new_job = service.create_job(job_in, user_id=current_user.user_id)
    api_cache.clear_prefix("jobs:")
    return new_job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = JobService(db)
    updated_job = service.update_job(job_id, job_in, user_id=current_user.user_id)
    api_cache.clear_prefix("jobs:")
    return updated_job

@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
    job_id: int,
    company_id: Optional[int] = Query(None, description="Optional company ID that owns this job posting"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = JobService(db)
    service.delete_job(job_id=job_id, deleted_by_user_id=current_user.user_id, company_id=company_id)
    api_cache.clear_prefix("jobs:")
    return {"message": f"Job #{job_id} deleted successfully."}
