from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.job_repository import JobRepository
from app.repositories.company_repository import CompanyRepository
from app.models.job import Job, JobStatus, EmploymentType

class JobService:
    def __init__(self, db: Session):
        self.job_repo = JobRepository(db)
        self.company_repo = CompanyRepository(db)

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
        status_filter: Optional[JobStatus] = JobStatus.open,
        min_salary: Optional[int] = None,
        company_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Job]:
        return self.job_repo.search_jobs(
            query=query,
            location=location,
            employment_type=employment_type,
            status=status_filter,
            min_salary=min_salary,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def create_job(self, job_in, user_id: Optional[int] = None) -> Job:
        company = self.company_repo.get_by_id(job_in.company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Company #{job_in.company_id} not found."
            )
        return self.job_repo.create(job_in, user_id)

    def update_job(self, job_id: int, job_in, user_id: Optional[int] = None) -> Job:
        job = self.get_job(job_id)
        return self.job_repo.update(job, job_in, user_id)

    def delete_job(self, job_id: int, company_id: int, deleted_by_user_id: int) -> Job:
        job = self.job_repo.get_by_id_and_company(job_id, company_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job #{job_id} belonging to company #{company_id} not found."
            )
        return self.job_repo.soft_delete(job, deleted_by_user_id)
