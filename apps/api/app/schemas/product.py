import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import LifecycleState
from app.schemas.attribute import ColorOptionDTO, SizeOptionDTO
from app.schemas.common import BaseSchema
from app.schemas.taxonomy import SubcategorySummaryDTO


# --- Image Schemas ---
class ProductImageDTO(BaseSchema):
    id: uuid.UUID
    product_id: uuid.UUID
    url: str
    alt_text: str | None = None
    is_primary: bool
    display_order: int
    created_at: datetime


class ProductImageCreate(BaseSchema):
    url: str = Field(min_length=1, max_length=500)
    alt_text: str | None = Field(default=None, max_length=150)
    is_primary: bool = False
    display_order: int = 0


class ProductImageReorderItem(BaseSchema):
    image_id: uuid.UUID
    display_order: int
    is_primary: bool = False


class ProductImageReorderRequest(BaseSchema):
    images: list[ProductImageReorderItem]


# --- Variant Schemas ---
class ProductVariantDTO(BaseSchema):
    id: uuid.UUID
    product_id: uuid.UUID
    size_id: uuid.UUID | None = None
    color_id: uuid.UUID | None = None
    sku: str | None = None
    is_available: bool
    created_at: datetime
    updated_at: datetime
    size: SizeOptionDTO | None = None
    color: ColorOptionDTO | None = None


class VariantMatrixGenerateRequest(BaseSchema):
    size_ids: list[uuid.UUID] = Field(
        min_length=1, description="List of size IDs to include in the matrix"
    )
    color_ids: list[uuid.UUID] = Field(
        min_length=1, description="List of color IDs to include in the matrix"
    )
    default_available: bool = True


class VariantAvailabilityUpdate(BaseSchema):
    is_available: bool


class VariantCreateRequest(BaseSchema):
    size_id: uuid.UUID | None = None
    color_id: uuid.UUID | None = None
    sku: str | None = None
    is_available: bool = True


# --- Product Administrative Schemas ---
class ProductCreateRequest(BaseSchema):
    category_id: uuid.UUID
    subcategory_id: uuid.UUID
    name: str = Field(min_length=1, max_length=150)
    slug: str | None = Field(default=None, max_length=180)
    description: str | None = None
    material: str | None = Field(default=None, max_length=100)
    style_code: str | None = Field(default=None, max_length=50)
    lifecycle_state: LifecycleState = LifecycleState.DRAFT
    manual_sold_out: bool = False
    featured: bool = False
    meta_title: str | None = Field(default=None, max_length=100)
    meta_description: str | None = Field(default=None, max_length=200)


class ProductUpdateRequest(BaseSchema):
    category_id: uuid.UUID | None = None
    subcategory_id: uuid.UUID | None = None
    name: str | None = Field(default=None, max_length=150)
    slug: str | None = Field(default=None, max_length=180)
    description: str | None = None
    material: str | None = Field(default=None, max_length=100)
    style_code: str | None = Field(default=None, max_length=50)
    lifecycle_state: LifecycleState | None = None
    manual_sold_out: bool | None = None
    featured: bool | None = None
    meta_title: str | None = Field(default=None, max_length=100)
    meta_description: str | None = Field(default=None, max_length=200)


class ProductLifecycleUpdate(BaseSchema):
    lifecycle_state: LifecycleState


class ProductSoldOutUpdate(BaseSchema):
    manual_sold_out: bool


class AdminProductResponse(BaseSchema):
    id: uuid.UUID
    category_id: uuid.UUID
    subcategory_id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    material: str | None = None
    style_code: str | None = None
    lifecycle_state: LifecycleState
    manual_sold_out: bool
    featured: bool
    meta_title: str | None = None
    meta_description: str | None = None
    created_at: datetime
    updated_at: datetime
    is_available: bool = Field(description="Derived overall availability")
    subcategory: SubcategorySummaryDTO | None = None
    images: list[ProductImageDTO] = Field(default_factory=list)
    variants: list[ProductVariantDTO] = Field(default_factory=list)


# --- Customer Public Schemas (ZERO PRICE GUARANTEE) ---
class PublicProductSummaryResponse(BaseSchema):
    """
    Public customer summary model.
    CRITICAL: Contains NO price or internal administrative fields.
    """

    id: uuid.UUID
    name: str
    slug: str
    material: str | None = None
    style_code: str | None = None
    featured: bool
    is_available: bool = Field(
        description="True if not manual_sold_out AND at least one variant is available"
    )
    primary_image_url: str | None = None
    category_name: str | None = None
    category_slug: str | None = None
    subcategory_name: str | None = None
    subcategory_slug: str | None = None
    available_sizes: list[str] = Field(default_factory=list)
    available_colors: list[str] = Field(default_factory=list)


class PublicProductDetailResponse(BaseSchema):
    """
    Public customer detail model.
    CRITICAL: Contains NO price or internal administrative fields.
    """

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    material: str | None = None
    style_code: str | None = None
    featured: bool
    is_available: bool
    meta_title: str | None = None
    meta_description: str | None = None
    category_name: str | None = None
    category_slug: str | None = None
    subcategory_name: str | None = None
    subcategory_slug: str | None = None
    images: list[ProductImageDTO] = Field(default_factory=list)
    variants: list[ProductVariantDTO] = Field(default_factory=list)
