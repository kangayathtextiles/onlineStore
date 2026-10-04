from collections.abc import AsyncGenerator
from typing import Any

from fastapi import Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_session

__all__ = ["get_async_session", "get_current_admin_user", "AdminUserContext"]

AdminUserContext = dict[str, Any]

async def get_current_admin_user(
    x_admin_api_key: str | None = Header(None, alias="X-Admin-Api-Key")
) -> AdminUserContext:
    """
    Validates the X-Admin-Api-Key header against the configured ADMIN_API_KEY.
    Provides simple, dependency-free admin protection for the deployed MVP.
    """
    if not x_admin_api_key or x_admin_api_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing Admin API Key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    return {
        "role": "admin",
        "authenticated": True,
        "mode": "api_key",
        "description": "Authenticated via simple API key",
    }


# Typed shorthand for FastAPI route dependency injection
DbSession = AsyncSession
DatabaseDep = AsyncGenerator[AsyncSession, None]
