from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.job_repository import JobRepository
from app.repositories.company_repository import CompanyRepository
from app.models.job import Job, JobStatus, EmploymentType

from app.repositories.user_repository import UserRepository

class JobService:
    def __init__(self, db: Session):
        self.job_repo = JobRepository(db)
        self.company_repo = CompanyRepository(db)
        self.user_repo = UserRepository(db)

    def get_job(self, job_id: int) -> Job:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job #{job_id} not found."
            )
        return job

    def list_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        employment_type: Optional[EmploymentType] = None,
        status_filter: Optional[JobStatus] = None,
        min_salary: Optional[int] = None,
        company_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: Optional[str] = "created_at",
        order: Optional[str] = "desc"
    ) -> List[Job]:
        # Default to open jobs for public search unless filtering by specific company
        if status_filter is None and company_id is None:
            status_filter = JobStatus.open

        return self.job_repo.search_jobs(
            query=query,
            location=location,
            employment_type=employment_type,
            status=status_filter,
            min_salary=min_salary,
            company_id=company_id,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
            order=order,
        )

    def create_job(self, job_in, user_id: Optional[int] = None) -> Job:
        company = self.company_repo.get_by_id(job_in.company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Company #{job_in.company_id} not found."
            )

        is_admin = False
        if user_id:
            user = self.user_repo.get_user_by_id(user_id)
            if user:
                is_admin = user.is_admin

        # 1. Company Verification Check
        if not company.is_verified and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your company registration is pending administrator verification. Job posting is disabled until verified."
            )

        # 2. Company Ownership Check
        is_owner = (company.created_by == user_id) or (company.created_by is None and company.updated_by == user_id)
        if user_id and not is_owner and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only post job listings for your own organization."
            )

        return self.job_repo.create(job_in, user_id)

    def _check_job_ownership(self, job: Job, user_id: Optional[int]):
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials required."
            )
        user = self.user_repo.get_user_by_id(user_id)
        is_admin = user.is_admin if user else False
        company = job.company
        is_owner = company and (
            (company.created_by == user_id) or
            (company.created_by is None and company.updated_by == user_id)
        )
        if not is_admin and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage job postings belonging to your own organization."
            )

    def update_job(self, job_id: int, job_in, user_id: Optional[int] = None) -> Job:
        job = self.get_job(job_id)
        self._check_job_ownership(job, user_id)
        return self.job_repo.update(job, job_in, user_id)

    def delete_job(self, job_id: int, deleted_by_user_id: int, company_id: Optional[int] = None) -> Job:
        if company_id:
            job = self.job_repo.get_by_id_and_company(job_id, company_id)
        else:
            job = self.job_repo.get_by_id(job_id)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job #{job_id} not found."
            )
        self._check_job_ownership(job, deleted_by_user_id)
        return self.job_repo.soft_delete(job, deleted_by_user_id)
