from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.repositories.attribute_repository import AttributeRepository
from app.schemas.attribute import ColorOptionDTO, SizeOptionDTO

router = APIRouter(prefix="/attributes", tags=["Public Attributes"])


@router.get(
    "/sizes", response_model=list[SizeOptionDTO], summary="List all available sizes for filtering"
)
async def list_public_sizes(
    session: AsyncSession = Depends(get_async_session),
) -> list[SizeOptionDTO]:
    repo = AttributeRepository(session)
    sizes = await repo.list_sizes()
    return [SizeOptionDTO(id=s.id, name=s.name, display_order=s.display_order) for s in sizes]


@router.get(
    "/colors",
    response_model=list[ColorOptionDTO],
    summary="List all available colors for filtering",
)
async def list_public_colors(
    session: AsyncSession = Depends(get_async_session),
) -> list[ColorOptionDTO]:
    repo = AttributeRepository(session)
    colors = await repo.list_colors()
    return [
        ColorOptionDTO(id=c.id, name=c.name, hex_code=c.hex_code, display_order=c.display_order)
        for c in colors
    ]
