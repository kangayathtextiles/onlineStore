from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.schemas.store import StoreProfileResponse, StoreStatusResponse
from app.services.store_service import StoreService

router = APIRouter(prefix="/store", tags=["Public Store"])


@router.get("", response_model=StoreProfileResponse, summary="Get public store profile and status")
async def get_public_store(
    session: AsyncSession = Depends(get_async_session),
) -> StoreProfileResponse:
    service = StoreService(session)
    return await service.get_public_store_profile()


@router.get(
    "/status", response_model=StoreStatusResponse, summary="Get real-time shop open/closed status"
)
async def get_public_store_status(
    session: AsyncSession = Depends(get_async_session),
) -> StoreStatusResponse:
    service = StoreService(session)
    return await service.get_store_status()
