import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.schemas.common import PaginatedResponse
from app.schemas.product import (
    PublicProductDetailResponse,
    PublicProductSummaryResponse,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Public Products"])


@router.get(
    "",
    response_model=PaginatedResponse[PublicProductSummaryResponse],
    summary="Discover and filter published products (Zero price exposure)",
)
async def list_public_products(
    category: str | None = Query(default=None, description="Category slug filter"),
    subcategory: str | None = Query(default=None, description="Subcategory slug filter"),
    size_id: uuid.UUID | None = Query(default=None, description="Size option UUID filter"),
    color_id: uuid.UUID | None = Query(default=None, description="Color option UUID filter"),
    available_only: bool = Query(default=False, description="Filter for in-stock items only"),
    search: str | None = Query(
        default=None, description="Keyword search in title, material, style code"
    ),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_async_session),
) -> PaginatedResponse[PublicProductSummaryResponse]:
    service = ProductService(session)
    return await service.list_public_products(
        category_slug=category,
        subcategory_slug=subcategory,
        size_id=size_id,
        color_id=color_id,
        available_only=available_only,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{slug}",
    response_model=PublicProductDetailResponse,
    summary="Get product detail by slug with image gallery and variant availability",
)
async def get_public_product_detail(
    slug: str,
    session: AsyncSession = Depends(get_async_session),
) -> PublicProductDetailResponse:
    service = ProductService(session)
    return await service.get_public_product_by_slug(slug)
