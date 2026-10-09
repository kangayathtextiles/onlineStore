from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.schemas.attribute import ColorOptionDTO, SizeOptionDTO
from app.services.attribute_service import AttributeService

router = APIRouter(prefix="/attributes", tags=["Public Attributes"])


@router.get(
    "/sizes", response_model=list[SizeOptionDTO], summary="List all available sizes for filtering"
)
async def list_public_sizes(
    session: AsyncSession = Depends(get_async_session),
) -> list[SizeOptionDTO]:
    service = AttributeService(session)
    sizes = await service.list_sizes()
    return [SizeOptionDTO(id=s.id, name=s.name, display_order=s.display_order) for s in sizes]


@router.get(
    "/colors",
    response_model=list[ColorOptionDTO],
    summary="List all available colors for filtering",
)
async def list_public_colors(
    session: AsyncSession = Depends(get_async_session),
) -> list[ColorOptionDTO]:
    service = AttributeService(session)
    colors = await service.list_colors()
    return [
        ColorOptionDTO(id=c.id, name=c.name, hex_code=c.hex_code, display_order=c.display_order)
        for c in colors
    ]
