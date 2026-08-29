import uuid
from datetime import UTC, datetime, time
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import DayOfWeek, OverrideMode

if TYPE_CHECKING:
    pass


class StoreProfile(Base, UUIDMixin, TimestampMixin):
    """
    Singleton canonical store profile holding physical shop location,
    contact information, and public metadata.
    """

    __tablename__ = "stores"

    name: Mapped[str] = mapped_column(String(100), default="Kangayath", nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    whatsapp_number: Mapped[str] = mapped_column(String(20), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(200), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    locality: Mapped[str] = mapped_column(String(100), nullable=False)
    panchayat: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Kerala", nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    show_prices: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    schedules: Mapped[list["OperatingSchedule"]] = relationship(
        "OperatingSchedule",
        back_populates="store",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="OperatingSchedule.day_of_week",
    )


class OperatingSchedule(Base, UUIDMixin):
    """
    Weekly operating hours for a specific day of the week.
    """

    __tablename__ = "operating_schedules"
    __table_args__ = (
        UniqueConstraint("store_id", "day_of_week", name="uq_operating_schedule_store_day"),
    )

    store_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_of_week: Mapped[DayOfWeek] = mapped_column(
        Enum(DayOfWeek, native_enum=False, length=10),
        nullable=False,
    )
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    open_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    close_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    # Relationship
    store: Mapped[StoreProfile] = relationship("StoreProfile", back_populates="schedules")


class StoreStatus(Base, UUIDMixin):
    """
    Real-time store status tracking with manual override capabilities.
    """

    __tablename__ = "store_statuses"

    override_mode: Mapped[OverrideMode] = mapped_column(
        Enum(OverrideMode, native_enum=False, length=20),
        default=OverrideMode.AUTO,
        nullable=False,
    )
    override_banner: Mapped[str | None] = mapped_column(String(255), nullable=True)
    override_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
