import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product


class CustomSection(Base, UUIDMixin, TimestampMixin):
    """
    Dynamic promotional showcase collection curated by the store owner.
    """

    __tablename__ = "custom_sections"

    title: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(200), nullable=True)
    banner_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    items: Mapped[list["CustomSectionItem"]] = relationship(
        "CustomSectionItem",
        back_populates="section",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="CustomSectionItem.sort_order",
    )


class CustomSectionItem(Base, UUIDMixin):
    """
    Curated association linking a Product to a CustomSection with manual sort order.
    """

    __tablename__ = "custom_section_items"
    __table_args__ = (
        UniqueConstraint(
            "section_id",
            "product_id",
            name="uq_custom_section_items_section_product",
        ),
        Index("idx_custom_section_items_order", "section_id", "sort_order"),
    )

    section_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("custom_sections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    section: Mapped[CustomSection] = relationship("CustomSection", back_populates="items")
    product: Mapped["Product"] = relationship(
        "Product", back_populates="section_items", lazy="selectin"
    )
