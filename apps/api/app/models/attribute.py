from typing import TYPE_CHECKING

from sqlalchemy import (
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.models.variant import ProductVariant


class SizeOption(Base, UUIDMixin):
    """
    Standardized size reference dictionary (e.g. S, M, L, 32, Free Size).
    """

    __tablename__ = "size_options"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant",
        back_populates="size",
        passive_deletes="all",
    )


class ColorOption(Base, UUIDMixin):
    """
    Standardized color reference dictionary (e.g. Maroon, Navy Blue with hex code).
    """

    __tablename__ = "color_options"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hex_code: Mapped[str | None] = mapped_column(String(7), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant",
        back_populates="color",
        passive_deletes="all",
    )
