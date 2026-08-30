import uuid
from datetime import datetime, time
from decimal import Decimal

from pydantic import Field

from app.models.enums import DayOfWeek, OverrideMode
from app.schemas.common import BaseSchema


class OperatingScheduleDTO(BaseSchema):
    day_of_week: DayOfWeek
    is_closed: bool = False
    open_time: time | None = None
    close_time: time | None = None


class OperatingScheduleUpdate(BaseSchema):
    day_of_week: DayOfWeek
    is_closed: bool
    open_time: time | None = None
    close_time: time | None = None


class StoreProfileBase(BaseSchema):
    name: str = Field(min_length=1, max_length=100)
    tagline: str | None = Field(default=None, max_length=255)
    description: str | None = None
    primary_phone: str = Field(default="", max_length=20)
    phone_primary: str | None = Field(default=None, max_length=20)
    phone_secondary: str | None = Field(default=None, max_length=20)
    whatsapp_number: str = Field(default="", max_length=20)
    email: str | None = Field(default=None, max_length=100)
    address_line1: str = Field(default="", max_length=200)
    address_line2: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    locality: str = Field(default="", max_length=100)
    panchayat: str = Field(default="", max_length=100)
    district: str = Field(default="", max_length=100)
    state: str = Field(default="Kerala", max_length=100)
    pincode: str = Field(default="", max_length=10)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    google_maps_url: str | None = None
    show_prices: bool = True
    show_style_codes: bool = True


class StoreProfileUpdate(BaseSchema):
    name: str | None = Field(default=None, max_length=100)
    tagline: str | None = Field(default=None, max_length=255)
    description: str | None = None
    primary_phone: str | None = Field(default=None, max_length=20)
    phone_primary: str | None = Field(default=None, max_length=20)
    phone_secondary: str | None = Field(default=None, max_length=20)
    whatsapp_number: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=100)
    address_line1: str | None = Field(default=None, max_length=200)
    address_line2: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    locality: str | None = Field(default=None, max_length=100)
    panchayat: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=10)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    google_maps_url: str | None = None
    show_prices: bool | None = None
    show_style_codes: bool | None = None


class StoreStatusResponse(BaseSchema):
    is_open: bool = Field(description="Derived real-time open status in Asia/Kolkata timezone")
    effective_mode: OverrideMode = Field(
        description="Active override mode (AUTO, FORCE_OPEN, FORCE_CLOSED)"
    )
    current_time_ist: str = Field(description="Current store time string in Asia/Kolkata (IST)")
    today_day: DayOfWeek = Field(description="Current day of week in Asia/Kolkata (IST)")
    today_schedule: OperatingScheduleDTO | None = Field(
        default=None, description="Operating hours for today"
    )
    banner_message: str | None = Field(default=None, description="Public notice banner message")
    override_until: datetime | None = Field(
        default=None, description="Auto-expiry timestamp for override"
    )


class StoreProfileResponse(StoreProfileBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    schedules: list[OperatingScheduleDTO] = Field(default_factory=list)
    status: StoreStatusResponse | None = None


class StoreOverrideRequest(BaseSchema):
    override_mode: OverrideMode
    override_banner: str | None = Field(default=None, max_length=255)
    override_until: datetime | None = None
