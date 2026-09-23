# Application Domain Exceptions
# Defines custom domain errors for job application workflows.
# Handles errors such as duplicate applications, missing records, and expired job offers.

from fastapi import status
from app.exceptions.base import AppException

class ApplicationNotFoundException(AppException):
    def __init__(self, application_id: int = None):
        detail = f"Application #{application_id} not found." if application_id else "Application not found."
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="APPLICATION_NOT_FOUND",
            detail=detail
        )

class DuplicateApplicationException(AppException):
    def __init__(self, detail: str = "You have already submitted an application for this job."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="APPLICATION_ALREADY_EXISTS",
            detail=detail
        )

class OfferExpiredException(AppException):
    def __init__(self, detail: str = "The offer window for this application has expired."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="OFFER_EXPIRED",
            detail=detail
        )

class InvalidStatusTransitionException(AppException):
    def __init__(self, from_status: str, to_status: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_STATUS_TRANSITION",
            detail=f"Cannot transition application from '{from_status}' to '{to_status}'."
        )
