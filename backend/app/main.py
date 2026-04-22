"""FastAPI application factory and entry point"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.middleware import setup_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager.

    Startup: Initialize resources
    Shutdown: Cleanup resources
    """
    # Startup
    app.state.settings = get_settings()
    print("Application startup complete")

    yield

    # Shutdown
    print("Application shutdown")


def create_app() -> FastAPI:
    """Create and configure FastAPI application.

    Returns:
        FastAPI: Configured FastAPI application
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.API_TITLE,
        version=settings.API_VERSION,
        description="FastAPI backend for FoodStore e-commerce platform",
        lifespan=lifespan,
    )

    # Setup middleware
    setup_middleware(app)

    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "ok",
            "version": settings.API_VERSION,
        }

    # Root endpoint
    @app.get("/", tags=["root"])
    async def root():
        """Root endpoint."""
        return {
            "message": "FoodStore API",
            "version": settings.API_VERSION,
            "docs": f"{settings.API_V1_STR}/docs",
        }

    return app


# Create app instance
app = create_app()
