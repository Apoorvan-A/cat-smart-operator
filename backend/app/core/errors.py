"""Uniform error envelope + handlers. Owner: Claude 1. See docs/API_CONTRACT.md.

All errors return: { "error": { "code", "message", "detail" } }.
"""
from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Domain error carrying an API error code + HTTP status."""

    def __init__(self, code: str, message: str, http_status: int = 400, detail: dict | None = None):
        self.code = code
        self.message = message
        self.http_status = http_status
        self.detail = detail or {}
        super().__init__(message)


def _envelope(code: str, message: str, detail: dict | None = None) -> dict:
    return {"error": {"code": code, "message": message, "detail": detail or {}}}


# Common shortcuts
def not_found(what: str) -> AppError:
    return AppError("NOT_FOUND", f"{what} not found", status.HTTP_404_NOT_FOUND)


def unauthorized(message: str = "Not authenticated") -> AppError:
    return AppError("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)


def forbidden(message: str = "Insufficient role") -> AppError:
    return AppError("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.http_status,
            content=_envelope(exc.code, exc.message, exc.detail),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_envelope("VALIDATION_ERROR", "Request validation failed",
                              {"errors": exc.errors()}),
        )
