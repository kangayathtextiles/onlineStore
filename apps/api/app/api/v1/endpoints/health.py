import logging
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_async_session
from app.schemas.health import HealthResponse, SubsystemHealth

logger = logging.getLogger("kangayath.api.health")

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="Detailed Health Check")
async def get_health(
    session: AsyncSession = Depends(get_async_session),
) -> HealthResponse:
    """
    Returns detailed system health, environment metadata, and subsystem readiness.
    Includes actual database connectivity verification.
    """
    subsystems = [
        SubsystemHealth(
            name="core-api",
            status="healthy",
            details="FastAPI core kernel operational",
        ),
        SubsystemHealth(
            name="configuration",
            status="healthy",
            details=f"Environment: {settings.ENVIRONMENT}",
        ),
    ]

    # Verify actual database connectivity
    db_status: Literal["healthy", "degraded", "unhealthy"]
    try:
        await session.execute(text("SELECT 1"))
        subsystems.append(
            SubsystemHealth(
                name="database",
                status="healthy",
                details="PostgreSQL connection pool active",
            )
        )
        db_status = "healthy"
    except Exception as e:
        logger.error("Health check database probe failed: %s", str(e))
        subsystems.append(
            SubsystemHealth(
                name="database",
                status="unhealthy",
                details="Database connection unavailable",
            )
        )
        db_status = "degraded"

    overall_status: Literal["healthy", "degraded", "unhealthy"] = (
        "healthy" if db_status == "healthy" else "degraded"
    )

    return HealthResponse(
        status=overall_status,
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
        subsystems=subsystems,
    )
