from fastapi import status
from app.exceptions.base import AppException

class JobNotFoundException(AppException):
    def __init__(self, job_id: int = None):
        detail = f"Job #{job_id} not found." if job_id else "Job not found."
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="JOB_NOT_FOUND",
            detail=detail
        )

class CompanyNotFoundException(AppException):
    def __init__(self, company_id: int = None):
        detail = f"Company #{company_id} not found." if company_id else "Company not found."
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="COMPANY_NOT_FOUND",
            detail=detail
        )

class JobNotOpenException(AppException):
    def __init__(self, detail: str = "This job posting is not currently accepting applications."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="JOB_NOT_OPEN",
            detail=detail
        )

class InvalidSalaryRangeException(AppException):
    def __init__(self, detail: str = "Minimum salary cannot be greater than maximum salary."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_SALARY_RANGE",
            detail=detail
        )

class CompanyNotVerifiedException(AppException):
    def __init__(self, detail: str = "Your company registration is pending administrator verification. Job posting is disabled until verified."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="COMPANY_NOT_VERIFIED",
            detail=detail
        )

class NotCompanyOwnerException(AppException):
    def __init__(self, detail: str = "Access denied. You can only manage job listings for your own organization."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN_ACTION",
            detail=detail
        )
