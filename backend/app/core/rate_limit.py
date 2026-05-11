"""Rate limiting configuration using slowapi."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, status
from fastapi.responses import JSONResponse
import time

# Global limiter instance (singleton, imported by routers)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],  # No global limit — limits are per-endpoint
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a standardized 429 response with Retry-After header.

    Body follows the project's {error, message} contract.
    Headers include Retry-After and X-RateLimit-* for client backoff.
    """
    retry_after = getattr(exc, "retry_after", 60)

    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "rate_limit_exceeded",
            "message": f"Too many requests. Please retry after {retry_after} seconds.",
            "retry_after": retry_after,
        },
        headers={
            "Retry-After": str(retry_after),
            "X-RateLimit-Limit": str(getattr(exc, "limit", "")),
            "X-RateLimit-Reset": str(int(time.time()) + int(retry_after)),
        },
    )
