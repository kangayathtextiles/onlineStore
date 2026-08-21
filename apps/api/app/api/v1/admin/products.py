import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.models.enums import LifecycleState
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.product import (
    AdminProductResponse,
    ProductCreateRequest,
    ProductImageCreate,
    ProductImageReorderRequest,
    ProductLifecycleUpdate,
    ProductSoldOutUpdate,
    ProductUpdateRequest,
    VariantAvailabilityUpdate,
    VariantCreateRequest,
    VariantMatrixGenerateRequest,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Admin Products"])


@router.get(
    "",
    response_model=PaginatedResponse[AdminProductResponse],
    summary="List all products for admin",
)
async def list_admin_products(
    lifecycle_state: LifecycleState | None = Query(
        default=None, description="Filter by lifecycle state"
    ),
    category_id: uuid.UUID | None = Query(default=None, description="Filter by category UUID"),
    subcategory_id: uuid.UUID | None = Query(
        default=None, description="Filter by subcategory UUID"
    ),
    search: str | None = Query(default=None, description="Search query"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> PaginatedResponse[AdminProductResponse]:
    service = ProductService(session)
    return await service.list_admin_products(
        lifecycle_state=lifecycle_state,
        category_id=category_id,
        subcategory_id=subcategory_id,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.post(
    "", response_model=AdminProductResponse, status_code=201, summary="Create a new garment product"
)
async def create_product(
    req: ProductCreateRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.create_product(req)


@router.get(
    "/{product_id}", response_model=AdminProductResponse, summary="Get full product admin details"
)
async def get_admin_product(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.get_admin_product_by_id(product_id)


@router.put("/{product_id}", response_model=AdminProductResponse, summary="Update product details")
async def update_product(
    product_id: uuid.UUID,
    req: ProductUpdateRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.update_product(product_id, req)


@router.delete(
    "/{product_id}",
    response_model=SuccessResponse,
    summary="Delete product and cascade associations",
)
async def delete_product(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    service = ProductService(session)
    await service.delete_product(product_id)
    return SuccessResponse(message="Product deleted successfully.")


@router.put(
    "/{product_id}/lifecycle",
    response_model=AdminProductResponse,
    summary="Update product lifecycle state (DRAFT/PUBLISHED/HIDDEN/ARCHIVED)",
)
async def update_product_lifecycle(
    product_id: uuid.UUID,
    req: ProductLifecycleUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.update_lifecycle_state(product_id, req)


@router.put(
    "/{product_id}/sold-out",
    response_model=AdminProductResponse,
    summary="Toggle master product sold-out override",
)
async def update_product_sold_out(
    product_id: uuid.UUID,
    req: ProductSoldOutUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.update_sold_out_state(product_id, req)


# --- Product Images ---
@router.post(
    "/{product_id}/images",
    response_model=AdminProductResponse,
    status_code=201,
    summary="Attach image (Max 6 limit)",
)
async def add_product_image(
    product_id: uuid.UUID,
    req: ProductImageCreate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.add_image(product_id, req)


@router.delete(
    "/{product_id}/images/{image_id}", response_model=AdminProductResponse, summary="Delete image"
)
async def delete_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.delete_image(product_id, image_id)


@router.put(
    "/{product_id}/images/reorder",
    response_model=AdminProductResponse,
    summary="Reorder images and set primary",
)
async def reorder_product_images(
    product_id: uuid.UUID,
    req: ProductImageReorderRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.reorder_images(product_id, req)


# --- Product Variants ---
@router.post(
    "/{product_id}/variants/matrix",
    response_model=AdminProductResponse,
    summary="Generate Size x Color variant matrix",
)
async def generate_variant_matrix(
    product_id: uuid.UUID,
    req: VariantMatrixGenerateRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.generate_variant_matrix(product_id, req)


@router.post(
    "/{product_id}/variants",
    response_model=AdminProductResponse,
    status_code=201,
    summary="Add a single variant",
)
async def add_single_variant(
    product_id: uuid.UUID,
    req: VariantCreateRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.add_single_variant(product_id, req)


@router.put(
    "/{product_id}/variants/{variant_id}/availability",
    response_model=AdminProductResponse,
    summary="Toggle individual variant availability",
)
async def update_variant_availability(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    req: VariantAvailabilityUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.update_variant_availability(product_id, variant_id, req)


@router.delete(
    "/{product_id}/variants/{variant_id}",
    response_model=AdminProductResponse,
    summary="Delete variant",
)
async def delete_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> AdminProductResponse:
    service = ProductService(session)
    return await service.delete_variant(product_id, variant_id)
