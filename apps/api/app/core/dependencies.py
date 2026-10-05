from collections.abc import AsyncGenerator
from typing import Any
from urllib.parse import urlparse

from fastapi import Cookie, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_admin_api_key, verify_admin_session_token
from app.db.session import get_async_session

__all__ = ["get_async_session", "get_current_admin_user", "AdminUserContext"]

AdminUserContext = dict[str, Any]


async def get_current_admin_user(
    request: Request,
    admin_session: str | None = Cookie(None, alias="admin_session"),
    authorization: str | None = Header(None, alias="Authorization"),
    x_admin_session: str | None = Header(None, alias="X-Admin-Session"),
    x_admin_api_key: str | None = Header(None, alias="X-Admin-Api-Key"),
) -> AdminUserContext:
    """
    Authoritative Admin Authentication Dependency.
    Supports:
    1. HttpOnly 'admin_session' Cookie (Primary Web Dashboard auth with CSRF protection)
    2. Authorization: Bearer <session_token> Header (API/Client auth)
    3. X-Admin-Session: <session_token> Header
    4. X-Admin-Api-Key Header (CLI / automated tests / backward compatibility)
    Uses constant-time comparison and HMAC-SHA256 signature verification.
    """
    # 1. Check Session Token (from Cookie or Bearer / Custom Header)
    token = None
    if admin_session:
        token = admin_session.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif x_admin_session:
        token = x_admin_session.strip()

    if token:
        payload = verify_admin_session_token(token)
        if payload:
            # CSRF Protection: For state-changing methods authenticated via cookie,
            # verify that the request Origin / Referer matches trusted CORS origins.
            if admin_session and request.method in ("POST", "PUT", "PATCH", "DELETE"):
                origin = request.headers.get("origin")
                referer = request.headers.get("referer")
                candidate_origin: str | None = None
                if origin:
                    candidate_origin = origin.rstrip("/")
                elif referer:
                    parsed = urlparse(referer)
                    if parsed.scheme and parsed.netloc:
                        candidate_origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")

                if candidate_origin:
                    raw_origins = (
                        settings.BACKEND_CORS_ORIGINS
                        if isinstance(settings.BACKEND_CORS_ORIGINS, list)
                        else [settings.BACKEND_CORS_ORIGINS]
                    )
                    allowed_origins = {o.rstrip("/") for o in raw_origins}
                    if settings.SITE_URL:
                        allowed_origins.add(settings.SITE_URL.rstrip("/"))

                    is_trusted = candidate_origin in allowed_origins
                    if not is_trusted and not settings.is_production:
                        is_trusted = any(
                            candidate_origin.startswith(prefix)
                            for prefix in ("http://localhost", "http://127.0.0.1", "http://test")
                        )

                    if not is_trusted:
                        raise HTTPException(
                            status_code=403,
                            detail="CSRF verification failed: untrusted origin.",
                        )
                elif settings.is_production:
                    raise HTTPException(
                        status_code=403,
                        detail="CSRF verification failed: missing Origin or Referer.",
                    )

            return {
                "role": "admin",
                "authenticated": True,
                "mode": "session",
                "sub": payload.get("sub", "admin"),
                "exp": payload.get("exp"),
            }

    # 2. Check Admin API Key Header (constant-time verification)
    if x_admin_api_key and verify_admin_api_key(x_admin_api_key):
        return {
            "role": "admin",
            "authenticated": True,
            "mode": "api_key",
            "description": "Authenticated via API key",
        }

    # If neither is valid, raise 401 Unauthorized
    raise HTTPException(
        status_code=401,
        detail="Authentication required: please log in or provide a valid Admin API Key.",
        headers={"WWW-Authenticate": "Bearer"},
    )


# Typed shorthand for FastAPI route dependency injection
DbSession = AsyncSession
DatabaseDep = AsyncGenerator[AsyncSession, None]
