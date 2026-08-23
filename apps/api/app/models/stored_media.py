from sqlalchemy import Index, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class StoredMedia(Base, UUIDMixin, TimestampMixin):
    """
    Database-backed persistent media store for product and upload assets.
    Guarantees zero image loss across container restarts and ephemeral redeploys.
    """

    __tablename__ = "stored_media"
    __table_args__ = (Index("idx_stored_media_cat_filename", "category", "filename", unique=True),)

    filename: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), default="products", nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), default="image/jpeg", nullable=False)
    data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
