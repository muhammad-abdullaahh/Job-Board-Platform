from fastapi import HTTPException

class AppException(HTTPException):
    """
    Base exception for all domain-specific application exceptions.
    Ensures every error carries a machine-readable error_code alongside HTTP status.
    """
    def __init__(self, status_code: int, error_code: str, detail: str = ""):
        self.error_code = error_code
        super().__init__(status_code=status_code, detail=detail)
