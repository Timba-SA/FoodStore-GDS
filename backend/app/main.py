"""FastAPI application factory and entry point"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import get_settings
from app.core.middleware import setup_middleware
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.modules.auth.router import router as auth_router
from app.modules.admin.router import router as admin_router, shared_admin_router
from app.modules.categorias.router import router as categorias_router
from app.modules.ingredientes.router import router as ingredientes_router
from app.modules.productos.router import router as productos_router
from app.modules.direcciones.router import router as direcciones_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.pagos.router import router as pagos_router
from app.modules.perfil.router import router as perfil_router
from app.modules.cocina.router import router as cocina_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager.

    Startup: Run Alembic migrations then initialize resources.
    Shutdown: Cleanup resources.
    """
    import subprocess  # noqa: PLC0415

    # Run migrations synchronously at startup so the DB is always up-to-date
    # before the first request is handled. This is idempotent — if already at
    # head, Alembic does nothing.
    print("Running Alembic migrations...")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"[ERROR] Alembic migration failed:\n{result.stderr}")
        raise RuntimeError("Database migration failed — aborting startup")
    print(result.stdout or "Migrations up to date.")

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

    # Rate limiting — limiter on state + SlowAPI middleware + 429 handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Include routers
    app.include_router(auth_router, prefix=settings.API_V1_STR)
    app.include_router(admin_router, prefix=settings.API_V1_STR)
    app.include_router(shared_admin_router, prefix=settings.API_V1_STR)
    app.include_router(categorias_router, prefix=settings.API_V1_STR)
    app.include_router(ingredientes_router, prefix=settings.API_V1_STR)
    app.include_router(productos_router, prefix=settings.API_V1_STR)
    app.include_router(direcciones_router, prefix=settings.API_V1_STR)
    app.include_router(pedidos_router, prefix=settings.API_V1_STR)
    app.include_router(pagos_router, prefix=settings.API_V1_STR)
    app.include_router(perfil_router, prefix=settings.API_V1_STR)
    app.include_router(cocina_router, prefix=settings.API_V1_STR)

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
