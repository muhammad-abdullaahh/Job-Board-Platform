from fastapi import status
from app.exceptions.base import AppException


class JobNotFoundException(AppException):
    """Raised when a job posting is not found or has been soft-deleted."""
    def __init__(self, job_id: int = None):
        detail = f"Job with ID {job_id} not found." if job_id else "Job not found."
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class CompanyNotFoundException(AppException):
    """Raised when the company referenced in a job does not exist."""
    def __init__(self, company_id: int = None):
        detail = f"Company with ID {company_id} not found." if company_id else "Company not found."
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class JobNotOpenException(AppException):
    """Raised when someone tries to apply to a job that is closed or in draft status."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job posting is not currently accepting applications."
        )
