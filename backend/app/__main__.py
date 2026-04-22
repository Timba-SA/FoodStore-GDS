"""Application entry point for python -m app"""

import uvicorn

from app.core.config import get_settings


def main():
    """Run the application."""
    settings = get_settings()

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )


if __name__ == "__main__":
    main()
