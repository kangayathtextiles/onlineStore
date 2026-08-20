from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import HealthResponse, SubsystemHealth

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="Detailed Health Check")
async def get_health() -> HealthResponse:
    """
    Returns detailed system health, environment metadata, and subsystem readiness.
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

    return HealthResponse(
        status="healthy",
        environment=settings.ENVIRONMENT,
        version=settings.VERSION,
        subsystems=subsystems,
    )
