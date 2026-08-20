from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field


class SubsystemHealth(BaseModel):
    name: str
    status: Literal["healthy", "degraded", "unhealthy"]
    details: str | None = None


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"] = "healthy"
    environment: str
    version: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    subsystems: list[SubsystemHealth] = Field(default_factory=list)
