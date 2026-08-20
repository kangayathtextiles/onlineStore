import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product


class SavedItemCollection(Base, UUIDMixin, TimestampMixin):
    """
    Server-side collection anchor for anonymous customer saved items.
    """

    __tablename__ = "saved_item_collections"

    session_token: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )

    # Relationships
    items: Mapped[list["SavedItem"]] = relationship(
        "SavedItem",
        back_populates="collection",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="SavedItem.saved_at.desc()",
    )


class SavedItem(Base, UUIDMixin):
    """
    Individual saved product reference within an anonymous session collection.
    """

    __tablename__ = "saved_items"
    __table_args__ = (
        UniqueConstraint("collection_id", "product_id", name="uq_saved_items_collection_product"),
    )

    collection_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("saved_item_collections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    collection: Mapped[SavedItemCollection] = relationship(
        "SavedItemCollection", back_populates="items"
    )
    product: Mapped["Product"] = relationship(
        "Product", back_populates="saved_entries", lazy="selectin"
    )
