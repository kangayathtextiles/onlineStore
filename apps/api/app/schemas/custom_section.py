import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.common import BaseSchema
from app.schemas.product import PublicProductSummaryResponse


class CustomSectionItemDTO(BaseSchema):
    id: uuid.UUID
    section_id: uuid.UUID
    product_id: uuid.UUID
    sort_order: int
    created_at: datetime
    product_name: str | None = None
    product_slug: str | None = None
    product_image_url: str | None = None
    is_available: bool = True


class SectionItemReorderItem(BaseSchema):
    product_id: uuid.UUID
    sort_order: int


class SectionItemReorderRequest(BaseSchema):
    items: list[SectionItemReorderItem]


class SectionCreateRequest(BaseSchema):
    title: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    subtitle: str | None = Field(default=None, max_length=200)
    banner_image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    display_order: int = 0
    product_ids: list[uuid.UUID] = Field(default_factory=list)


class SectionUpdateRequest(BaseSchema):
    title: str | None = Field(default=None, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    subtitle: str | None = Field(default=None, max_length=200)
    banner_image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    display_order: int | None = None


class AdminSectionResponse(BaseSchema):
    id: uuid.UUID
    title: str
    slug: str
    subtitle: str | None = None
    banner_image_url: str | None = None
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime
    items: list[CustomSectionItemDTO] = Field(default_factory=list)


class PublicSectionResponse(BaseSchema):
    id: uuid.UUID
    title: str
    slug: str
    subtitle: str | None = None
    banner_image_url: str | None = None
    display_order: int
    products: list[PublicProductSummaryResponse] = Field(default_factory=list)
