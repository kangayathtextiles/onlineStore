import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.attribute import ColorOption, SizeOption
    from app.models.product import Product


class ProductVariant(Base, UUIDMixin, TimestampMixin):
    """
    Concrete stock and availability unit representing a Size and Color combination.
    """

    __tablename__ = "product_variants"
    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "size_id",
            "color_id",
            name="uq_product_variants_combination",
        ),
        Index("idx_product_variants_prod_avail", "product_id", "is_available"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    size_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("size_options.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    color_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("color_options.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    sku: Mapped[str | None] = mapped_column(String(60), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    size: Mapped["SizeOption | None"] = relationship(
        "SizeOption", back_populates="variants", lazy="selectin"
    )
    color: Mapped["ColorOption | None"] = relationship(
        "ColorOption", back_populates="variants", lazy="selectin"
    )
