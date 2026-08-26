from fastapi import status
from app.exceptions.base import AppException


class InvalidCredentialsException(AppException):
    """Raised when email/password combination is wrong during login."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )


class UserAlreadyExistsException(AppException):
    """Raised when trying to register with an email that is already taken."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )


class AdminAlreadyExistsException(AppException):
    """Raised when trying to register an admin with an email that is already taken."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An admin with this email already exists."
        )


class UnauthorizedException(AppException):
    """Raised when a request is made without a valid token."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )


class ForbiddenException(AppException):
    """Raised when an authenticated user tries to access a resource they don't have permission for."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
