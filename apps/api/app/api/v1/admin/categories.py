import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.schemas.common import SuccessResponse
from app.schemas.taxonomy import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    SubcategoryCreate,
    SubcategoryResponse,
    SubcategorySummaryDTO,
    SubcategoryUpdate,
)
from app.services.taxonomy_service import TaxonomyService

router = APIRouter(prefix="/categories", tags=["Admin Categories"])


# --- Categories ---
@router.get("", response_model=list[CategoryResponse], summary="List all categories for admin")
async def list_admin_categories(
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> list[CategoryResponse]:
    service = TaxonomyService(session)
    return await service.list_admin_categories()


@router.post("", response_model=CategoryResponse, status_code=201, summary="Create a new Category")
async def create_category(
    req: CategoryCreate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> CategoryResponse:
    service = TaxonomyService(session)
    cat = await service.create_category(req)
    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        thumbnail_url=cat.thumbnail_url,
        display_order=cat.display_order,
        is_active=cat.is_active,
        show_prices=cat.show_prices,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        subcategories=[],
    )


@router.put("/{category_id}", response_model=CategoryResponse, summary="Update Category metadata")
async def update_category(
    category_id: uuid.UUID,
    req: CategoryUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> CategoryResponse:
    service = TaxonomyService(session)
    cat = await service.update_category(category_id, req)
    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        thumbnail_url=cat.thumbnail_url,
        display_order=cat.display_order,
        is_active=cat.is_active,
        show_prices=cat.show_prices,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        subcategories=[
            SubcategorySummaryDTO(
                id=sub.id,
                category_id=sub.category_id,
                name=sub.name,
                slug=sub.slug,
                display_order=sub.display_order,
                is_active=sub.is_active,
            )
            for sub in cat.subcategories
        ],
    )


@router.delete(
    "/{category_id}", response_model=SuccessResponse, summary="Delete Category (RESTRICT guard)"
)
async def delete_category(
    category_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    service = TaxonomyService(session)
    await service.delete_category(category_id)
    return SuccessResponse(message="Category deleted successfully.")


# --- Subcategories ---
@router.post(
    "/subcategories",
    response_model=SubcategoryResponse,
    status_code=201,
    summary="Create a new Subcategory",
)
async def create_subcategory(
    req: SubcategoryCreate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SubcategoryResponse:
    service = TaxonomyService(session)
    sub = await service.create_subcategory(req)
    return SubcategoryResponse(
        id=sub.id,
        category_id=sub.category_id,
        name=sub.name,
        slug=sub.slug,
        display_order=sub.display_order,
        is_active=sub.is_active,
        created_at=sub.created_at,
        updated_at=sub.updated_at,
    )


@router.put(
    "/subcategories/{subcategory_id}",
    response_model=SubcategoryResponse,
    summary="Update Subcategory",
)
async def update_subcategory(
    subcategory_id: uuid.UUID,
    req: SubcategoryUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SubcategoryResponse:
    service = TaxonomyService(session)
    sub = await service.update_subcategory(subcategory_id, req)
    return SubcategoryResponse(
        id=sub.id,
        category_id=sub.category_id,
        name=sub.name,
        slug=sub.slug,
        display_order=sub.display_order,
        is_active=sub.is_active,
        created_at=sub.created_at,
        updated_at=sub.updated_at,
    )


@router.delete(
    "/subcategories/{subcategory_id}", response_model=SuccessResponse, summary="Delete Subcategory"
)
async def delete_subcategory(
    subcategory_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    service = TaxonomyService(session)
    await service.delete_subcategory(subcategory_id)
    return SuccessResponse(message="Subcategory deleted successfully.")
