# Authentication Exceptions
# Defines custom domain errors for login failures, duplicate users, and token issues.
# Standardizes error codes for password resets, expired tokens, and invalid credentials.

from fastapi import status
from app.exceptions.base import AppException

class InvalidCredentialsException(AppException):
    def __init__(self, detail: str = "Invalid email or password."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS",
            detail=detail
        )

class UserAlreadyExistsException(AppException):
    def __init__(self, detail: str = "A user with this email already exists."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="USER_ALREADY_EXISTS",
            detail=detail
        )

class UserNotFoundException(AppException):
    def __init__(self, detail: str = "User account not found."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="USER_NOT_FOUND",
            detail=detail
        )

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Could not validate credentials."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            detail=detail
        )

class ForbiddenException(AppException):
    def __init__(self, detail: str = "You do not have permission to perform this action."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN_ACTION",
            detail=detail
        )

class AccountSuspendedException(AppException):
    def __init__(self, detail: str = "Your account has been deactivated or suspended."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="ACCOUNT_SUSPENDED",
            detail=detail
        )

class InvalidTokenException(AppException):
    def __init__(self, detail: str = "Invalid or expired token."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_TOKEN",
            detail=detail
        )
