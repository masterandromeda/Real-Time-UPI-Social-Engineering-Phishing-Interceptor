"""Custom exception classes and HTTP exception handlers."""
from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class UPISentinelError(Exception):
    """Base error for UPI Sentinel."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(UPISentinelError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(f"{resource} '{resource_id}' not found", "NOT_FOUND", 404)


class ValidationError(UPISentinelError):
    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR", 422)


class AuthenticationError(UPISentinelError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, "AUTHENTICATION_ERROR", 401)


class AuthorizationError(UPISentinelError):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, "AUTHORIZATION_ERROR", 403)


class IntegrationError(UPISentinelError):
    def __init__(self, provider: str, message: str):
        super().__init__(f"{provider}: {message}", "INTEGRATION_ERROR", 502)


class AnalysisError(UPISentinelError):
    def __init__(self, message: str):
        super().__init__(message, "ANALYSIS_ERROR", 500)


async def upi_sentinel_exception_handler(request: Request, exc: UPISentinelError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.code,
            "message": exc.message,
            "path": str(request.url.path),
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import traceback
    import logging
    logging.error("Unhandled exception: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": str(exc),
            "path": str(request.url.path),
        },
    )
