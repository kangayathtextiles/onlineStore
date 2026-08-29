from datetime import UTC, datetime, timedelta, timezone, tzinfo
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundException
from app.models.enums import DayOfWeek, OverrideMode
from app.models.store import OperatingSchedule, StoreProfile, StoreStatus
from app.repositories.store_repository import StoreRepository
from app.schemas.store import (
    OperatingScheduleDTO,
    OperatingScheduleUpdate,
    StoreOverrideRequest,
    StoreProfileResponse,
    StoreProfileUpdate,
    StoreStatusResponse,
)

IST_TIMEZONE: tzinfo
try:
    IST_TIMEZONE = ZoneInfo("Asia/Kolkata")
except Exception:
    IST_TIMEZONE = timezone(timedelta(hours=5, minutes=30), name="IST")

WEEKDAY_MAP = {
    0: DayOfWeek.MONDAY,
    1: DayOfWeek.TUESDAY,
    2: DayOfWeek.WEDNESDAY,
    3: DayOfWeek.THURSDAY,
    4: DayOfWeek.FRIDAY,
    5: DayOfWeek.SATURDAY,
    6: DayOfWeek.SUNDAY,
}


class StoreService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = StoreRepository(session)

    async def get_public_store_profile(self) -> StoreProfileResponse:
        store = await self.repo.get_singleton_profile()
        if not store:
            raise EntityNotFoundException("StoreProfile", "singleton")

        status = await self.get_store_status()
        schedules = await self.repo.get_operating_schedules()

        city = store.locality or store.district or store.panchayat or "Kangeyam"
        primary_phone = store.primary_phone or "+91 94470 00000"

        return StoreProfileResponse(
            id=store.id,
            name=store.name,
            tagline=store.tagline,
            description=store.description,
            primary_phone=primary_phone,
            phone_primary=primary_phone,
            phone_secondary=None,
            whatsapp_number=store.whatsapp_number,
            email=None,
            address_line1=store.address_line1,
            address_line2=store.address_line2,
            city=city,
            locality=store.locality,
            panchayat=store.panchayat,
            district=store.district,
            state=store.state,
            pincode=store.pincode,
            latitude=store.latitude,
            longitude=store.longitude,
            google_maps_url=store.google_maps_url,
            show_prices=store.show_prices,
            created_at=store.created_at,
            updated_at=store.updated_at,
            schedules=[
                OperatingScheduleDTO(
                    day_of_week=s.day_of_week,
                    is_closed=s.is_closed,
                    open_time=s.open_time,
                    close_time=s.close_time,
                )
                for s in schedules
            ],
            status=status,
        )

    async def get_store_status(self) -> StoreStatusResponse:
        now_ist = datetime.now(IST_TIMEZONE)
        current_time = now_ist.time()
        today_day = WEEKDAY_MAP[now_ist.weekday()]

        status_record = await self.repo.get_store_status()
        today_schedule = await self.repo.get_schedule_for_day(today_day)

        override_mode = status_record.override_mode if status_record else OverrideMode.AUTO
        override_banner = status_record.override_banner if status_record else None
        override_until = status_record.override_until if status_record else None

        # Check if override has expired
        if override_until and datetime.now(UTC) > override_until:
            override_mode = OverrideMode.AUTO
            override_banner = None

        # Evaluate is_open
        if override_mode == OverrideMode.FORCE_OPEN:
            is_open = True
        elif override_mode == OverrideMode.FORCE_CLOSED:
            is_open = False
        else:  # AUTO
            if not today_schedule or today_schedule.is_closed:
                is_open = False
            elif today_schedule.open_time and today_schedule.close_time:
                is_open = today_schedule.open_time <= current_time <= today_schedule.close_time
            else:
                is_open = False

        today_dto = (
            OperatingScheduleDTO(
                day_of_week=today_schedule.day_of_week,
                is_closed=today_schedule.is_closed,
                open_time=today_schedule.open_time,
                close_time=today_schedule.close_time,
            )
            if today_schedule
            else None
        )

        return StoreStatusResponse(
            is_open=is_open,
            effective_mode=override_mode,
            current_time_ist=now_ist.strftime("%Y-%m-%d %I:%M:%S %p IST"),
            today_day=today_day,
            today_schedule=today_dto,
            banner_message=override_banner,
            override_until=override_until,
        )

    async def update_store_profile(self, data: StoreProfileUpdate) -> StoreProfile:
        store = await self.repo.get_singleton_profile()
        if not store:
            raise EntityNotFoundException("StoreProfile", "singleton")

        update_dict = data.model_dump(exclude_unset=True)

        # Handle city field mapping to locality, district, panchayat
        if "city" in update_dict and update_dict["city"]:
            city_val = str(update_dict.pop("city")).strip()
            store.locality = city_val
            store.district = city_val
            store.panchayat = city_val

        # Handle phone_primary mapping to primary_phone
        if "phone_primary" in update_dict and update_dict["phone_primary"]:
            store.primary_phone = str(update_dict.pop("phone_primary")).strip()

        # Clean non-database fields
        update_dict.pop("phone_secondary", None)
        update_dict.pop("email", None)

        for key, value in update_dict.items():
            if hasattr(store, key) and value is not None:
                setattr(store, key, value)

        await self.session.commit()
        await self.session.refresh(store)
        return store

    async def update_operating_schedules(
        self, updates: list[OperatingScheduleUpdate]
    ) -> list[OperatingSchedule]:
        store = await self.repo.get_singleton_profile()
        if not store:
            raise EntityNotFoundException("StoreProfile", "singleton")

        existing_schedules = {s.day_of_week: s for s in await self.repo.get_operating_schedules()}

        for update_item in updates:
            if update_item.day_of_week in existing_schedules:
                sched = existing_schedules[update_item.day_of_week]
                sched.is_closed = update_item.is_closed
                sched.open_time = update_item.open_time
                sched.close_time = update_item.close_time
            else:
                new_sched = OperatingSchedule(
                    store_id=store.id,
                    day_of_week=update_item.day_of_week,
                    is_closed=update_item.is_closed,
                    open_time=update_item.open_time,
                    close_time=update_item.close_time,
                )
                self.session.add(new_sched)

        await self.session.commit()
        return list(await self.repo.get_operating_schedules())

    async def update_store_override(self, req: StoreOverrideRequest) -> StoreStatus:
        status_record = await self.repo.get_store_status()
        if not status_record:
            status_record = StoreStatus(
                override_mode=req.override_mode,
                override_banner=req.override_banner,
                override_until=req.override_until,
            )
            self.session.add(status_record)
        else:
            status_record.override_mode = req.override_mode
            status_record.override_banner = req.override_banner
            status_record.override_until = req.override_until

        await self.session.commit()
        await self.session.refresh(status_record)
        return status_record
