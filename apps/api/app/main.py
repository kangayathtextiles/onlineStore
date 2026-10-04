import logging
import uuid as uuid_lib
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response
from sqlalchemy import text

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.db.session import async_session_maker
from app.schemas.common import ErrorDetail, ErrorResponse
from app.services import storage_service

# Configure structured logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger("kangayath.api")





@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle management."""
    logger.info("Initializing %s (v%s)...", settings.PROJECT_NAME, settings.VERSION)
    logger.info("Active environment: %s", settings.ENVIRONMENT)
    logger.info("Debug mode: %s", settings.DEBUG)


    # Verify database connectivity at startup
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        logger.info("Database connectivity: OK")
    except Exception as e:
        logger.error("Database connectivity check FAILED: %s", str(e))
        # Don't prevent startup — allow health checks to report status

    yield
    logger.info("Shutting down %s...", settings.PROJECT_NAME)


# Conditionally disable docs in production
docs_url = "/docs" if not settings.is_production else None
redoc_url = "/redoc" if not settings.is_production else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=docs_url,
    redoc_url=redoc_url,
    lifespan=lifespan,
    description=(
        "Production-grade backend API for KANGAYATH WEB digital showroom and "
        "catalog discovery platform. Provides separate /api/v1/public and /api/v1/admin namespaces."
    ),
)

# GZip Compression for fast network transfers (>500 bytes)
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS configuration
if settings.BACKEND_CORS_ORIGINS:
    origins = (
        [origin.rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]
        if isinstance(settings.BACKEND_CORS_ORIGINS, list)
        else [settings.BACKEND_CORS_ORIGINS.rstrip("/")]
    )

    middleware_kwargs: dict[str, Any] = {
        "allow_origins": origins,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
        "expose_headers": ["*"],
    }

    if not settings.is_production:
        middleware_kwargs["allow_origin_regex"] = r"^https?://(localhost|127\.0\.0\.1|\[::1\]|.*\.onrender\.com|kangayath\.in|.*\.kangayath\.in)(:[0-9]+)?$"

    app.add_middleware(CORSMiddleware, **middleware_kwargs)


# X-Request-ID middleware for request tracing
@app.middleware("http")
async def add_request_id(request: Request, call_next):  # type: ignore[no-untyped-def]
    """Adds a unique X-Request-ID header to every response for traceability."""
    request_id = request.headers.get("X-Request-ID", str(uuid_lib.uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(_request: Request, exc: AppException) -> JSONResponse:
    """Handles all structured domain exceptions."""
    payload = ErrorResponse(
        error=ErrorDetail(
            code=exc.code,
            message=exc.message,
            details=exc.details,
        )
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=payload.model_dump(mode="json"),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """Handles unexpected uncaught exceptions, masking internal details."""
    logger.error("Unhandled internal server error: %s", str(exc), exc_info=True)

    # In development, include the error message for debugging
    message = (
        str(exc)
        if settings.DEBUG
        else "An unexpected internal error occurred. Please contact store support."
    )

    payload = ErrorResponse(
        error=ErrorDetail(
            code="INTERNAL_SERVER_ERROR",
            message=message,
            details={},
        )
    )
    return JSONResponse(
        status_code=500,
        content=payload.model_dump(mode="json"),
    )


# Health probe
@app.get("/health", tags=["health"], summary="Liveness / Readiness Probe")
async def root_health() -> dict[str, str]:
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }



# Media CDN redirect endpoint
# New uploads go to Supabase Storage and carry full CDN URLs, so /media/* is
# only needed as a backward-compat redirect for any old relative URLs.
@app.get("/media/{path:path}", tags=["media"], summary="Redirect to CDN-served media asset")
async def get_media_asset(path: str) -> Response:
    """
    Redirects legacy /media/<path> URLs to their Supabase Storage public URL.
    New product images already carry full https:// CDN URLs and bypass this endpoint.
    """
    clean_path = path.lstrip("/")
    if ".." in clean_path or clean_path.startswith("/"):
        return JSONResponse(status_code=400, content={"message": "Invalid path."})

    if not storage_service.is_configured():
        return JSONResponse(status_code=404, content={"message": "Media storage not configured."})

    cdn_url = storage_service.public_url(clean_path)
    return RedirectResponse(url=cdn_url, status_code=301)


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)
