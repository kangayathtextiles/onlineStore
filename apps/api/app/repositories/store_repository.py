from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import DayOfWeek
from app.models.store import OperatingSchedule, StoreProfile, StoreStatus
from app.repositories.base import BaseRepository


class StoreRepository(BaseRepository[StoreProfile]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(StoreProfile, session)

    async def get_singleton_profile(self) -> StoreProfile | None:
        stmt = select(StoreProfile).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_operating_schedules(
        self, store_id: str | None = None
    ) -> Sequence[OperatingSchedule]:
        stmt = select(OperatingSchedule).order_by(OperatingSchedule.day_of_week)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_schedule_for_day(self, day: DayOfWeek) -> OperatingSchedule | None:
        stmt = select(OperatingSchedule).where(OperatingSchedule.day_of_week == day).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_store_status(self) -> StoreStatus | None:
        stmt = select(StoreStatus).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
