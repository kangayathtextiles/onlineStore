import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import LifecycleState

if TYPE_CHECKING:
    from app.models.custom_section import CustomSectionItem
    from app.models.saved_item import SavedItem
    from app.models.taxonomy import Category, Subcategory
    from app.models.variant import ProductVariant


class Product(Base, UUIDMixin, TimestampMixin):
    """
    Core logical garment product entity.
    """

    __tablename__ = "products"
    __table_args__ = (
        Index(
            "idx_products_lifecycle_cat",
            "lifecycle_state",
            "category_id",
            "subcategory_id",
        ),
        Index("idx_products_search_name", "name"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    subcategory_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subcategories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    material: Mapped[str | None] = mapped_column(String(100), nullable=True)
    style_code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    lifecycle_state: Mapped[LifecycleState] = mapped_column(
        Enum(LifecycleState, native_enum=False, length=20),
        default=LifecycleState.DRAFT,
        nullable=False,
        index=True,
    )
    manual_sold_out: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    meta_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Relationships
    category: Mapped["Category"] = relationship(
        "Category", back_populates="products", lazy="selectin"
    )
    subcategory: Mapped["Subcategory"] = relationship(
        "Subcategory", back_populates="products", lazy="selectin"
    )
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ProductImage.display_order",
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    section_items: Mapped[list["CustomSectionItem"]] = relationship(
        "CustomSectionItem",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    saved_entries: Mapped[list["SavedItem"]] = relationship(
        "SavedItem",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ProductImage(Base, UUIDMixin):
    """
    Product visual assets with primary hero selection and sequence ordering.
    """

    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(150), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationship
    product: Mapped[Product] = relationship("Product", back_populates="images")
