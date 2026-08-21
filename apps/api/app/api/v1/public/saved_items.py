from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.schemas.saved_item import (
    SavedItemAvailabilityDTO,
    SavedItemBatchQueryRequest,
    SavedItemSyncRequest,
    SavedItemSyncResponse,
)
from app.services.saved_item_service import SavedItemService

router = APIRouter(prefix="/saved-items", tags=["Public Saved Items"])


@router.post(
    "/sync",
    response_model=SavedItemSyncResponse,
    summary="Synchronize anonymous client-saved products",
)
async def sync_saved_items(
    req: SavedItemSyncRequest,
    session: AsyncSession = Depends(get_async_session),
) -> SavedItemSyncResponse:
    service = SavedItemService(session)
    return await service.sync_saved_items(req)


@router.post(
    "/availability",
    response_model=list[SavedItemAvailabilityDTO],
    summary="Query live availability for saved products",
)
async def check_saved_items_availability(
    req: SavedItemBatchQueryRequest,
    session: AsyncSession = Depends(get_async_session),
) -> list[SavedItemAvailabilityDTO]:
    service = SavedItemService(session)
    return await service.get_saved_items_availability(req)
