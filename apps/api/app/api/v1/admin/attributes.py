import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.core.exceptions import DuplicateResourceException, EntityNotFoundException
from app.models.attribute import ColorOption, SizeOption
from app.repositories.attribute_repository import AttributeRepository
from app.schemas.attribute import (
    ColorOptionCreate,
    ColorOptionDTO,
    ColorOptionUpdate,
    SizeOptionCreate,
    SizeOptionDTO,
    SizeOptionUpdate,
)
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/attributes", tags=["Admin Attributes"])


# --- Sizes ---
@router.get(
    "/sizes", response_model=list[SizeOptionDTO], summary="List all size dictionary entries"
)
async def list_admin_sizes(
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> list[SizeOptionDTO]:
    repo = AttributeRepository(session)
    sizes = await repo.list_sizes()
    return [SizeOptionDTO(id=s.id, name=s.name, display_order=s.display_order) for s in sizes]


@router.post(
    "/sizes", response_model=SizeOptionDTO, status_code=201, summary="Create a new size entry"
)
async def create_admin_size(
    req: SizeOptionCreate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SizeOptionDTO:
    repo = AttributeRepository(session)
    existing = await repo.get_size_by_name(req.name)
    if existing:
        raise DuplicateResourceException("SizeOption", "name", req.name)

    size = SizeOption(name=req.name, display_order=req.display_order)
    await repo.create_size(size)
    await session.commit()
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
    repo = AttributeRepository(session)
    size = await repo.get_size_by_id(size_id)
    if not size:
        raise EntityNotFoundException("SizeOption", size_id)

    if req.name is not None:
        existing = await repo.get_size_by_name(req.name)
        if existing and existing.id != size_id:
            raise DuplicateResourceException("SizeOption", "name", req.name)
        size.name = req.name
    if req.display_order is not None:
        size.display_order = req.display_order

    await session.commit()
    return SizeOptionDTO(id=size.id, name=size.name, display_order=size.display_order)


@router.delete("/sizes/{size_id}", response_model=SuccessResponse, summary="Delete size option")
async def delete_admin_size(
    size_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    repo = AttributeRepository(session)
    size = await repo.get_size_by_id(size_id)
    if not size:
        raise EntityNotFoundException("SizeOption", size_id)
    await repo.delete_size(size)
    await session.commit()
    return SuccessResponse(message="Size option deleted successfully.")


# --- Colors ---
@router.get(
    "/colors", response_model=list[ColorOptionDTO], summary="List all color dictionary entries"
)
async def list_admin_colors(
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> list[ColorOptionDTO]:
    repo = AttributeRepository(session)
    colors = await repo.list_colors()
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
    repo = AttributeRepository(session)
    existing = await repo.get_color_by_name(req.name)
    if existing:
        raise DuplicateResourceException("ColorOption", "name", req.name)

    color = ColorOption(name=req.name, hex_code=req.hex_code, display_order=req.display_order)
    await repo.create_color(color)
    await session.commit()
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
    repo = AttributeRepository(session)
    color = await repo.get_color_by_id(color_id)
    if not color:
        raise EntityNotFoundException("ColorOption", color_id)

    if req.name is not None:
        existing = await repo.get_color_by_name(req.name)
        if existing and existing.id != color_id:
            raise DuplicateResourceException("ColorOption", "name", req.name)
        color.name = req.name
    if req.hex_code is not None:
        color.hex_code = req.hex_code
    if req.display_order is not None:
        color.display_order = req.display_order

    await session.commit()
    return ColorOptionDTO(
        id=color.id, name=color.name, hex_code=color.hex_code, display_order=color.display_order
    )


@router.delete("/colors/{color_id}", response_model=SuccessResponse, summary="Delete color option")
async def delete_admin_color(
    color_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> SuccessResponse:
    repo = AttributeRepository(session)
    color = await repo.get_color_by_id(color_id)
    if not color:
        raise EntityNotFoundException("ColorOption", color_id)
    await repo.delete_color(color)
    await session.commit()
    return SuccessResponse(message="Color option deleted successfully.")
