from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import AdminUserContext, get_async_session, get_current_admin_user
from app.schemas.store import (
    OperatingScheduleDTO,
    OperatingScheduleUpdate,
    StoreOverrideRequest,
    StoreProfileResponse,
    StoreProfileUpdate,
    StoreStatusResponse,
)
from app.services.store_service import StoreService

router = APIRouter(prefix="/store", tags=["Admin Store"])


@router.get(
    "",
    response_model=StoreProfileResponse,
    summary="Get full store profile and schedule configuration",
)
async def get_admin_store(
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> StoreProfileResponse:
    service = StoreService(session)
    return await service.get_public_store_profile()


@router.put(
    "",
    response_model=StoreProfileResponse,
    summary="Update store profile contact, address, or location",
)
async def update_admin_store(
    req: StoreProfileUpdate,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> StoreProfileResponse:
    service = StoreService(session)
    await service.update_store_profile(req)
    return await service.get_public_store_profile()


@router.put(
    "/schedule", response_model=list[OperatingScheduleDTO], summary="Update weekly operating hours"
)
async def update_admin_schedule(
    schedules: list[OperatingScheduleUpdate],
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> list[OperatingScheduleDTO]:
    service = StoreService(session)
    updated = await service.update_operating_schedules(schedules)
    return [
        OperatingScheduleDTO(
            day_of_week=s.day_of_week,
            is_closed=s.is_closed,
            open_time=s.open_time,
            close_time=s.close_time,
        )
        for s in updated
    ]


@router.post(
    "/override",
    response_model=StoreStatusResponse,
    summary="Set emergency shop open/closed override",
)
async def update_admin_override(
    req: StoreOverrideRequest,
    session: AsyncSession = Depends(get_async_session),
    _admin: AdminUserContext = Depends(get_current_admin_user),
) -> StoreStatusResponse:
    service = StoreService(session)
    await service.update_store_override(req)
    return await service.get_store_status()
