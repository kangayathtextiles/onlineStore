import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.product import Product


class Category(Base, UUIDMixin, TimestampMixin):
    """
    Top-level department category (e.g. Men, Women, Kids).
    """

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    subcategories: Mapped[list["Subcategory"]] = relationship(
        "Subcategory",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Subcategory.display_order",
    )
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="category",
        passive_deletes="all",
    )


class Subcategory(Base, UUIDMixin, TimestampMixin):
    """
    Second-level category classification belonging to a parent Category.
    """

    __tablename__ = "subcategories"
    __table_args__ = (
        UniqueConstraint("category_id", "name", name="uq_subcategories_category_name"),
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    category: Mapped[Category] = relationship("Category", back_populates="subcategories")
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="subcategory",
        passive_deletes="all",
    )
