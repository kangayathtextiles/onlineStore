from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.schemas.taxonomy import PublicCategoryTreeResponse
from app.services.taxonomy_service import TaxonomyService

router = APIRouter(prefix="/categories", tags=["Public Categories"])


@router.get(
    "",
    response_model=list[PublicCategoryTreeResponse],
    summary="List active categories and subcategories",
)
async def list_public_categories(
    session: AsyncSession = Depends(get_async_session),
) -> list[PublicCategoryTreeResponse]:
    service = TaxonomyService(session)
    return await service.list_public_categories()
