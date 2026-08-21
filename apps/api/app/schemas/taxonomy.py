import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.common import BaseSchema


class SubcategorySummaryDTO(BaseSchema):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    slug: str
    display_order: int
    is_active: bool


class SubcategoryCreate(BaseSchema):
    category_id: uuid.UUID
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    display_order: int = 0
    is_active: bool = True


class SubcategoryUpdate(BaseSchema):
    name: str | None = Field(default=None, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    display_order: int | None = None
    is_active: bool | None = None


class SubcategoryResponse(SubcategorySummaryDTO):
    created_at: datetime
    updated_at: datetime


class CategoryBase(BaseSchema):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    description: str | None = None
    thumbnail_url: str | None = Field(default=None, max_length=500)
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseSchema):
    name: str | None = Field(default=None, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    description: str | None = None
    thumbnail_url: str | None = Field(default=None, max_length=500)
    display_order: int | None = None
    is_active: bool | None = None


class CategoryResponse(BaseSchema):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    thumbnail_url: str | None = None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    subcategories: list[SubcategorySummaryDTO] = Field(default_factory=list)


class PublicCategoryTreeResponse(BaseSchema):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    thumbnail_url: str | None = None
    display_order: int
    subcategories: list[SubcategorySummaryDTO] = Field(default_factory=list)
