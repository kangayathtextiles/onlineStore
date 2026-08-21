from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

__all__ = ["get_async_session", "get_current_admin_user", "AdminUserContext"]

AdminUserContext = dict[str, Any]


async def get_current_admin_user() -> AdminUserContext:
    """
    Pluggable dependency injection placeholder for Owner / Admin identity.

    In Phase 05, this operates in unauthenticated MVP mode per explicit client mandate.
    In Phase 06, this dependency will be swapped to validate JWT Bearer tokens or
    secure session cookies without altering route handler logic or signatures.
    """
    return {
        "role": "admin",
        "authenticated": False,
        "mode": "unauthenticated_mvp",
        "description": "Pre-authentication boundary placeholder for Phase 06 JWT integration",
    }


# Typed shorthand for FastAPI route dependency injection
DbSession = AsyncSession
DatabaseDep = AsyncGenerator[AsyncSession, None]
