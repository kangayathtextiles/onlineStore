import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.dependencies import AdminUserContext, get_current_admin_user
from app.core.security import (
    create_admin_session_token,
    login_rate_limiter,
    verify_admin_api_key,
)

logger = logging.getLogger("kangayath.auth")

router = APIRouter(prefix="/auth", tags=["auth"])


class AdminLoginRequest(BaseModel):
    api_key: str = Field(..., min_length=1, description="Admin secret master key")


class AdminLoginResponse(BaseModel):
    status: str = "ok"
    expires_in: int


class AdminMeResponse(BaseModel):
    status: str = "authenticated"
    role: str = "admin"
    mode: str


@router.post("/login", response_model=AdminLoginResponse, summary="Admin Dashboard Login")
async def login(
    payload: AdminLoginRequest,
    request: Request,
    response: Response,
) -> AdminLoginResponse:
    """
    Authenticates the admin using the secure master key.
    Includes in-memory IP rate limiting to mitigate brute-force attempts.
    Sets an authoritative HttpOnly session cookie. The token is never returned in the body.
    """
    client_ip = request.client.host if request.client else "unknown"

    # Enforce brute-force rate limiting
    if login_rate_limiter.is_rate_limited(client_ip):
        retry_after = login_rate_limiter.get_retry_after(client_ip)
        logger.warning(
            "Admin login rate-limited for IP: %s (retry after %ss)", client_ip, retry_after
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {retry_after} seconds before retrying.",
            headers={"Retry-After": str(retry_after)},
        )

    # Constant-time comparison
    if not verify_admin_api_key(payload.api_key):
        login_rate_limiter.record_failed_attempt(client_ip)
        logger.warning("Failed admin login attempt from IP: %s", client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Successful login: reset rate limiter and generate signed session token
    login_rate_limiter.reset(client_ip)
    token = create_admin_session_token(settings.ADMIN_SESSION_EXPIRE_SECONDS)

    secure_setting = settings.ENVIRONMENT in ("staging", "production") or request.url.scheme == "https"
    samesite_setting: Literal["lax", "strict", "none"] = "lax"

    # Set authoritative HttpOnly session cookie
    response.set_cookie(
        key=settings.ADMIN_SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.ADMIN_SESSION_EXPIRE_SECONDS,
        httponly=True,
        secure=secure_setting,
        samesite=samesite_setting,
        path="/",
    )

    logger.info("Admin successfully authenticated from IP: %s", client_ip)

    return AdminLoginResponse(
        status="ok",
        expires_in=settings.ADMIN_SESSION_EXPIRE_SECONDS,
    )


@router.post("/logout", summary="Admin Dashboard Logout")
async def logout(
    request: Request,
    response: Response,
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> dict[str, str]:
    """
    Terminates admin session by clearing the HttpOnly cookie.
    """
    secure_setting = settings.ENVIRONMENT in ("staging", "production") or request.url.scheme == "https"
    samesite_setting: Literal["lax", "strict", "none"] = "lax"

    response.delete_cookie(
        key=settings.ADMIN_SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=secure_setting,
        samesite=samesite_setting,
    )
    return {"status": "ok", "message": "Successfully logged out"}


@router.get("/me", response_model=AdminMeResponse, summary="Current Admin Identity")
async def get_me(
    admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminMeResponse:
    """
    Validates current active admin session and returns identity details.
    """
    return AdminMeResponse(
        status="authenticated",
        role=admin.get("role", "admin"),
        mode=admin.get("mode", "unknown"),
    )
