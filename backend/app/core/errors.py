"""Custom exception classes and error handling."""
from typing import Optional, Dict, Any


class AppError(Exception):
    """Base application error."""
    
    def __init__(
        self,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 400
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary format."""
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details
            }
        }


class NotFoundError(AppError):
    """Resource not found error."""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource} not found",
            details={"resource": resource, "identifier": identifier},
            status_code=404
        )


class ValidationError(AppError):
    """Validation error."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            details=details,
            status_code=422
        )


class UnauthorizedError(AppError):
    """Unauthorized access error."""
    
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=401
        )


class ForbiddenError(AppError):
    """Forbidden access error."""
    
    def __init__(self, message: str = "Forbidden"):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403
        )


class ConflictError(AppError):
    """Resource conflict error (e.g., duplicate slug)."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="CONFLICT",
            message=message,
            details=details,
            status_code=409
        )
