from fastapi import HTTPException, status


class AppException(HTTPException):
    """
    Base exception for all custom application exceptions.
    All domain-specific exceptions inherit from this.

    Usage:
        raise SomeCustomException()
        # FastAPI will automatically return the correct HTTP response.
    """
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)
