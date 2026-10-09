import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.schemas.attribute import (
    ColorOptionCreate,
    ColorOptionDTO,
    ColorOptionUpdate,
    SizeOptionCreate,
    SizeOptionDTO,
    SizeOptionUpdate,
)
from app.schemas.common import SuccessResponse
from app.services.attribute_service import AttributeService

router = APIRouter(prefix="/attributes", tags=["Admin Attributes"])


# --- Sizes ---
@router.get(
    "/sizes", response_model=list[SizeOptionDTO], summary="List all size dictionary entries"
)
async def list_admin_sizes(
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> list[SizeOptionDTO]:
    service = AttributeService(session)
    sizes = await service.list_sizes()
    return [SizeOptionDTO(id=s.id, name=s.name, display_order=s.display_order) for s in sizes]


@router.post(
    "/sizes", response_model=SizeOptionDTO, status_code=201, summary="Create a new size entry"
)
async def create_admin_size(
    req: SizeOptionCreate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SizeOptionDTO:
    service = AttributeService(session)
    size = await service.create_size(req)
    return SizeOptionDTO(id=size.id, name=size.name, display_order=size.display_order)


@router.put(
    "/sizes/{size_id}", response_model=SizeOptionDTO, summary="Update size label or display order"
)
async def update_admin_size(
    size_id: uuid.UUID,
    req: SizeOptionUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SizeOptionDTO:
    service = AttributeService(session)
    size = await service.update_size(size_id, req)
    return SizeOptionDTO(id=size.id, name=size.name, display_order=size.display_order)


@router.delete("/sizes/{size_id}", response_model=SuccessResponse, summary="Delete size option")
async def delete_admin_size(
    size_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    service = AttributeService(session)
    await service.delete_size(size_id)
    return SuccessResponse(message="Size option deleted successfully.")


# --- Colors ---
@router.get(
    "/colors", response_model=list[ColorOptionDTO], summary="List all color dictionary entries"
)
async def list_admin_colors(
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> list[ColorOptionDTO]:
    service = AttributeService(session)
    colors = await service.list_colors()
    return [
        ColorOptionDTO(id=c.id, name=c.name, hex_code=c.hex_code, display_order=c.display_order)
        for c in colors
    ]


@router.post(
    "/colors", response_model=ColorOptionDTO, status_code=201, summary="Create a new color entry"
)
async def create_admin_color(
    req: ColorOptionCreate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> ColorOptionDTO:
    service = AttributeService(session)
    color = await service.create_color(req)
    return ColorOptionDTO(
        id=color.id, name=color.name, hex_code=color.hex_code, display_order=color.display_order
    )


@router.put(
    "/colors/{color_id}",
    response_model=ColorOptionDTO,
    summary="Update color name, hex code, or display order",
)
async def update_admin_color(
    color_id: uuid.UUID,
    req: ColorOptionUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> ColorOptionDTO:
    service = AttributeService(session)
    color = await service.update_color(color_id, req)
    return ColorOptionDTO(
        id=color.id, name=color.name, hex_code=color.hex_code, display_order=color.display_order
    )


@router.delete("/colors/{color_id}", response_model=SuccessResponse, summary="Delete color option")
async def delete_admin_color(
    color_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    service = AttributeService(session)
    await service.delete_color(color_id)
    return SuccessResponse(message="Color option deleted successfully.")
