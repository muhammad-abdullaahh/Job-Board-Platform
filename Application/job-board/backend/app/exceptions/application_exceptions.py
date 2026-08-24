from fastapi import status
from app.exceptions.base import AppException


class ApplicationNotFoundException(AppException):
    """Raised when an application is not found or has been soft-deleted."""
    def __init__(self, application_id: int = None):
        detail = f"Application with ID {application_id} not found." if application_id else "Application not found."
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class DuplicateApplicationException(AppException):
    """Raised when a user tries to apply to the same job more than once."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted an application for this job."
        )


class OfferExpiredException(AppException):
    """
    Raised when a company or user tries to act on an application
    whose 48-hour offer window has already expired.
    """
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The offer window for this application has expired."
        )


class InvalidStatusTransitionException(AppException):
    """
    Raised when someone tries to move an application to a status
    that is not a valid transition from its current state.
    E.g. jumping from 'pending' directly to 'hired'.
    """
    def __init__(self, from_status: str, to_status: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition application from '{from_status}' to '{to_status}'."
        )
