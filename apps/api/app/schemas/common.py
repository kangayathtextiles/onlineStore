import math
from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with standard serialization configurations."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class PaginatedResponse(BaseSchema, Generic[T]):
    """Standard pagination wrapper envelope."""

    items: list[T]
    total: int = Field(description="Total number of matching records across all pages")
    page: int = Field(ge=1, description="Current 1-indexed page number")
    page_size: int = Field(ge=1, le=100, description="Number of records per page")
    total_pages: int = Field(description="Total number of calculated pages")

    @classmethod
    def create(
        cls, items: list[T], total: int, page: int, page_size: int
    ) -> "PaginatedResponse[T]":
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ErrorResponse(BaseModel):
    error: ErrorDetail


class SuccessResponse(BaseSchema):
    success: bool = True
    message: str = "Operation completed successfully."
