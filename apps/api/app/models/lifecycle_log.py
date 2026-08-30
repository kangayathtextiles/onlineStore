import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin
from app.models.enums import LifecycleEventType

if TYPE_CHECKING:
    from app.models.product import Product


class ProductLifecycleLog(Base, UUIDMixin):
    """
    Immutable audit history log of garment lifecycle and QR status changes.
    """

    __tablename__ = "product_lifecycle_logs"
    __table_args__ = (
        Index("idx_lifecycle_logs_product_created", "product_id", "created_at"),
        Index("idx_lifecycle_logs_event_type", "event_type"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[LifecycleEventType] = mapped_column(
        Enum(LifecycleEventType, native_enum=False, length=30),
        nullable=False,
    )
    from_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    qr_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    style_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="lifecycle_logs")
