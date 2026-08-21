from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.schemas.custom_section import PublicSectionResponse
from app.services.custom_section_service import CustomSectionService

router = APIRouter(prefix="/sections", tags=["Public Sections"])


@router.get(
    "",
    response_model=list[PublicSectionResponse],
    summary="List active promotional custom sections",
)
async def list_public_sections(
    session: AsyncSession = Depends(get_async_session),
) -> list[PublicSectionResponse]:
    service = CustomSectionService(session)
    return await service.list_public_sections()


@router.get(
    "/{slug}",
    response_model=PublicSectionResponse,
    summary="Get custom section by slug with curated products",
)
async def get_public_section(
    slug: str,
    session: AsyncSession = Depends(get_async_session),
) -> PublicSectionResponse:
    service = CustomSectionService(session)
    return await service.get_public_section_by_slug(slug)
