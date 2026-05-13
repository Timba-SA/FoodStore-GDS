"""Middleware configuration for FastAPI application"""

import json
import logging
import time
from typing import Callable

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pythonjsonlogger import jsonlogger
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings


def setup_logging() -> None:
    """Configure JSON logging for the application."""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # JSON formatter
    formatter = jsonlogger.JsonFormatter()

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging."""

    async def dispatch(self, request: Request, call_next: Callable):
        """Log request and response details."""
        # Start timer
        start_time = time.time()

        # Get response
        try:
            response = await call_next(request)
        except Exception as exc:
            duration = time.time() - start_time
            logger = logging.getLogger(__name__)
            logger.error(
                f"Request failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "query": str(request.url.query),
                    "duration_ms": int(duration * 1000),
                    "error": str(exc),
                },
            )
            raise

        # Log response
        duration = time.time() - start_time
        logger = logging.getLogger(__name__)
        logger.info(
            f"Request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": int(duration * 1000),
            },
        )

        return response


class ExceptionMiddleware:
    """Custom exception handling middleware."""

    def __init__(self, app: FastAPI):
        """Initialize exception middleware."""
        self.app = app

    async def __call__(self, scope, receive, send):
        """Handle ASGI requests."""
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            """Wrap send to intercept response."""
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            # Log the exception
            logger = logging.getLogger(__name__)
            logger.exception(f"Unhandled exception: {exc}")

            # Send error response
            await send(
                {
                    "type": "http.response.start",
                    "status": 500,
                    "headers": [[b"content-type", b"application/json"]],
                }
            )

            error_response = {
                "detail": "Internal server error",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            }

            await send(
                {
                    "type": "http.response.body",
                    "body": json.dumps(error_response).encode(),
                }
            )


def setup_middleware(app: FastAPI) -> None:
    """Setup all middleware for the application.

    Args:
        app: FastAPI application instance
    """
    settings = get_settings()

    # Exception handlers
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle validation errors."""
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "errors": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle general exceptions."""
        logger = logging.getLogger(__name__)
        logger.exception(f"Unhandled exception: {exc}")

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal server error",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            },
        )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

    # Logging middleware
    app.add_middleware(LoggingMiddleware)

    # Setup logging
    setup_logging()
