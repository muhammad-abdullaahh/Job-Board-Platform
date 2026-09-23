# Job Management Service
# Coordinates creating, updating, closing, and querying job listings.
# Validates salary ranges, company verification status, and required skill tags.

from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.job_repository import JobRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.models.job import Job, JobStatus, EmploymentType
from app.exceptions import (
    JobNotFoundException,
    CompanyNotFoundException,
    CompanyNotVerifiedException,
    NotCompanyOwnerException,
    InvalidSalaryRangeException,
    ForbiddenException,
    UnauthorizedException,
)

class JobService:
    def __init__(self, db: Session):
        self.job_repo = JobRepository(db)
        self.company_repo = CompanyRepository(db)
        self.user_repo = UserRepository(db)

    def get_job(self, job_id: int) -> Job:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise JobNotFoundException(job_id)
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
        limit: int = 20,
        sort: Optional[str] = None,
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
            sort=sort,
            sort_by=sort_by,
            order=order,
        )

    def create_job(self, job_in, user_id: Optional[int] = None) -> Job:
        # 1. Salary Range Business Rule Validation (Plan Spec #12)
        if (
            job_in.salary_min is not None
            and job_in.salary_max is not None
            and job_in.salary_min > job_in.salary_max
        ):
            raise InvalidSalaryRangeException()

        company = self.company_repo.get_by_id(job_in.company_id)
        if not company:
            raise CompanyNotFoundException(job_in.company_id)

        is_admin = False
        if user_id:
            user = self.user_repo.get_user_by_id(user_id)
            if user:
                is_admin = user.is_admin

        # 2. Company Verification Check (Plan Spec #7)
        if not company.is_verified and not is_admin:
            raise CompanyNotVerifiedException()

        # 3. Company Ownership Check (Plan Spec #7)
        is_owner = (company.created_by == user_id) or (company.created_by is None and company.updated_by == user_id)
        if user_id and not is_owner and not is_admin:
            raise NotCompanyOwnerException()

        return self.job_repo.create(job_in, user_id)

    def _check_job_ownership(self, job: Job, user_id: Optional[int]):
        if not user_id:
            raise UnauthorizedException()
        user = self.user_repo.get_user_by_id(user_id)
        is_admin = user.is_admin if user else False
        company = job.company
        is_owner = company and (
            (company.created_by == user_id) or
            (company.created_by is None and company.updated_by == user_id)
        )
        if not is_admin and not is_owner:
            raise ForbiddenException("Access denied. You can only manage job postings belonging to your own organization.")

    def update_job(self, job_id: int, job_in, user_id: Optional[int] = None) -> Job:
        job = self.get_job(job_id)
        self._check_job_ownership(job, user_id)

        # Validate salary range across update payload and existing values
        s_min = job_in.salary_min if getattr(job_in, 'salary_min', None) is not None else job.salary_min
        s_max = job_in.salary_max if getattr(job_in, 'salary_max', None) is not None else job.salary_max
        if s_min is not None and s_max is not None and s_min > s_max:
            raise InvalidSalaryRangeException()

        return self.job_repo.update(job, job_in, user_id)

    def delete_job(self, job_id: int, deleted_by_user_id: int, company_id: Optional[int] = None) -> Job:
        if company_id:
            job = self.job_repo.get_by_id_and_company(job_id, company_id)
        else:
            job = self.job_repo.get_by_id(job_id)

        if not job:
            raise JobNotFoundException(job_id)
        self._check_job_ownership(job, deleted_by_user_id)
        return self.job_repo.soft_delete(job, deleted_by_user_id)
