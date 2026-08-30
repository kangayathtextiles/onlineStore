import hashlib
import logging
import mimetypes
import os
import uuid as uuid_lib
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.dependencies import get_async_session
from app.core.exceptions import AppException
from app.db.session import async_session_maker
from app.models.stored_media import StoredMedia
from app.schemas.common import ErrorDetail, ErrorResponse

# Configure structured logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger("kangayath.api")


# Ensure media directories exist before application startup
os.makedirs(settings.RESOLVED_MEDIA_ROOT, exist_ok=True)
os.makedirs(os.path.join(settings.RESOLVED_MEDIA_ROOT, "products"), exist_ok=True)
os.makedirs(os.path.join(settings.RESOLVED_MEDIA_ROOT, "uploads"), exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle management."""
    logger.info("Initializing %s (v%s)...", settings.PROJECT_NAME, settings.VERSION)
    logger.info("Active environment: %s", settings.ENVIRONMENT)
    logger.info("Debug mode: %s", settings.DEBUG)

    # Ensure media directories exist
    os.makedirs(settings.RESOLVED_MEDIA_ROOT, exist_ok=True)
    os.makedirs(os.path.join(settings.RESOLVED_MEDIA_ROOT, "products"), exist_ok=True)
    os.makedirs(os.path.join(settings.RESOLVED_MEDIA_ROOT, "uploads"), exist_ok=True)

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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\]|.*\.onrender\.com|kangayath\.in|.*\.kangayath\.in)(:[0-9]+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )


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


# Dynamic Media Serving Endpoint (Database-backed with Disk Caching & ETag support)
@app.get("/media/{path:path}", tags=["media"], summary="Retrieve static/uploaded media asset")
async def get_media_asset(
    path: str,
    request: Request,
    session: AsyncSession = Depends(get_async_session),
) -> Response:
    """
    High-performance media endpoint with database-backed persistence and disk caching.
    Serves directly from disk cache if present; otherwise lazily recovers from PostgreSQL StoredMedia.
    Supports HTTP ETag conditional caching (304 Not Modified).
    """
    # 1. Path traversal protection
    clean_path = os.path.normpath(path).replace("\\", "/")
    if (
        clean_path.startswith("../")
        or "/../" in clean_path
        or clean_path.startswith("/")
        or clean_path.startswith("..")
    ):
        return JSONResponse(status_code=400, content={"message": "Invalid path traversal."})

    disk_path = os.path.join(settings.RESOLVED_MEDIA_ROOT, clean_path)
    file_bytes: bytes | None = None
    content_type: str | None = None

    # 2. Check disk cache
    if os.path.exists(disk_path) and os.path.isfile(disk_path):
        try:
            with open(disk_path, "rb") as f:
                file_bytes = f.read()
            mime, _ = mimetypes.guess_type(disk_path)
            content_type = mime or "image/jpeg"
        except Exception:
            file_bytes = None

    # 3. Disk cache miss (e.g. fresh container startup/restart) -> Restore from StoredMedia in DB
    if file_bytes is None:
        parts = clean_path.split("/")
        filename = parts[-1]
        category = parts[0] if len(parts) > 1 else "products"

        try:
            stmt = select(StoredMedia).where(
                StoredMedia.filename == filename, StoredMedia.category == category
            )
            result = await session.execute(stmt)
            stored = result.scalar_one_or_none()

            if not stored:
                stmt_fallback = select(StoredMedia).where(StoredMedia.filename == filename)
                res_fb = await session.execute(stmt_fallback)
                stored = res_fb.scalar_one_or_none()

            if stored is not None:
                file_bytes = stored.data
                content_type = stored.content_type
                # Write back to local disk cache for subsequent requests
                try:
                    os.makedirs(os.path.dirname(disk_path), exist_ok=True)
                    with open(disk_path, "wb") as f:
                        f.write(stored.data)
                except Exception as write_err:
                    logger.warning("Could not write to disk cache: %s", str(write_err))
        except Exception as db_err:
            logger.error("Error retrieving stored media: %s", str(db_err))

    if file_bytes is None:
        return JSONResponse(status_code=404, content={"message": "Media file not found."})

    # 4. Compute deterministic ETag
    etag = f'"{hashlib.md5(file_bytes).hexdigest()}"'
    client_etag = request.headers.get("if-none-match")

    headers = {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "ETag": etag,
    }

    if client_etag and client_etag.strip('"') == etag.strip('"'):
        return Response(status_code=304, headers=headers)

    return Response(
        content=file_bytes,
        media_type=content_type or "image/jpeg",
        headers=headers,
    )


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)
