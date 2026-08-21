import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.common import BaseSchema
from app.schemas.product import PublicProductSummaryResponse


class SavedItemSyncRequest(BaseSchema):
    session_token: str = Field(
        min_length=8, max_length=64, description="Anonymous client session token"
    )
    product_ids: list[uuid.UUID] = Field(
        description="Client-side saved product UUIDs to synchronize"
    )


class SavedItemBatchQueryRequest(BaseSchema):
    product_ids: list[uuid.UUID] = Field(
        min_length=1, max_length=100, description="List of product IDs to query"
    )


class SavedItemAvailabilityDTO(BaseSchema):
    product_id: uuid.UUID
    product_name: str
    product_slug: str
    is_available: bool
    primary_image_url: str | None = None
    saved_at: datetime | None = None


class SavedItemSyncResponse(BaseSchema):
    session_token: str
    items: list[PublicProductSummaryResponse] = Field(default_factory=list)
    total_saved: int
