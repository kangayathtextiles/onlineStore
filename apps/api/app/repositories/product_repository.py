import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import LifecycleState
from app.models.product import Product, ProductImage
from app.models.taxonomy import Category, Subcategory
from app.models.variant import ProductVariant
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Product, session)

    async def get_by_id(self, id_: uuid.UUID) -> Product | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Product)
            .where(Product.id == id_)
            .options(
                selectinload(Product.category),
                selectinload(Product.subcategory),
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.size),
                selectinload(Product.variants).selectinload(ProductVariant.color),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Product | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Product)
            .where(Product.slug == slug)
            .options(
                selectinload(Product.category),
                selectinload(Product.subcategory),
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.size),
                selectinload(Product.variants).selectinload(ProductVariant.color),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_qr_code(self, qr_code: str) -> Product | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Product)
            .where(Product.qr_code == qr_code)
            .options(
                selectinload(Product.category),
                selectinload(Product.subcategory),
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.size),
                selectinload(Product.variants).selectinload(ProductVariant.color),
                selectinload(Product.lifecycle_logs),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_style_code(self, style_code: str) -> Product | None:
        stmt = select(Product).where(Product.style_code == style_code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_published_by_slug(self, slug: str) -> Product | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Product)
            .join(Category, Product.category_id == Category.id)
            .join(Subcategory, Product.subcategory_id == Subcategory.id)
            .where(
                Product.slug == slug,
                Product.lifecycle_state == LifecycleState.PUBLISHED,
                Product.is_damaged.is_(False),
                Product.is_retired.is_(False),
                Category.is_active.is_(True),
                Subcategory.is_active.is_(True),
            )
            .options(
                selectinload(Product.category),
                selectinload(Product.subcategory),
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.size),
                selectinload(Product.variants).selectinload(ProductVariant.color),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_public_products(
        self,
        category_slug: str | None = None,
        subcategory_slug: str | None = None,
        size_id: uuid.UUID | None = None,
        color_id: uuid.UUID | None = None,
        available_only: bool = False,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[Sequence[Product], int]:
        """
        Query public published products with active category/subcategory filters and faceted search.
        Damaged and retired items are strictly excluded from public discovery.
        """
        query = (
            select(Product)
            .join(Category, Product.category_id == Category.id)
            .join(Subcategory, Product.subcategory_id == Subcategory.id)
            .where(
                Product.lifecycle_state == LifecycleState.PUBLISHED,
                Product.is_damaged.is_(False),
                Product.is_retired.is_(False),
                Category.is_active.is_(True),
                Subcategory.is_active.is_(True),
            )
        )

        if category_slug:
            query = query.where(Category.slug == category_slug)
        if subcategory_slug:
            query = query.where(Subcategory.slug == subcategory_slug)

        if size_id:
            query = query.where(
                Product.id.in_(
                    select(ProductVariant.product_id).where(
                        ProductVariant.size_id == size_id,
                        ProductVariant.is_available.is_(True),
                    )
                )
            )

        if color_id:
            query = query.where(
                Product.id.in_(
                    select(ProductVariant.product_id).where(
                        ProductVariant.color_id == color_id,
                        ProductVariant.is_available.is_(True),
                    )
                )
            )

        if available_only:
            query = query.where(
                Product.manual_sold_out.is_(False),
                Product.id.in_(
                    select(ProductVariant.product_id).where(ProductVariant.is_available.is_(True))
                ),
            )

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.material.ilike(search_pattern),
                    Product.style_code.ilike(search_pattern),
                    Product.description.ilike(search_pattern),
                )
            )

        from sqlalchemy.orm import selectinload

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0

        # Paginate and order (Featured first, then newest) with full eager loading
        query = (
            query.order_by(Product.featured.desc(), Product.created_at.desc())
            .options(
                selectinload(Product.category),
                selectinload(Product.subcategory),
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.size),
                selectinload(Product.variants).selectinload(ProductVariant.color),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(query)
        items = result.scalars().all()

        return items, total

    async def list_admin_products(
        self,
        lifecycle_state: LifecycleState | None = None,
        category_id: uuid.UUID | None = None,
        subcategory_id: uuid.UUID | None = None,
        operational_status: str | None = None,
        include_retired: bool = False,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[Sequence[Product], int]:
        """
        Query administrative products including drafts, hidden, and archived items.
        """
        from sqlalchemy.orm import selectinload

        query = select(Product)

        if not include_retired and not operational_status:
            query = query.where(Product.is_retired.is_(False))

        if lifecycle_state:
            query = query.where(Product.lifecycle_state == lifecycle_state)
        if category_id:
            query = query.where(Product.category_id == category_id)
        if subcategory_id:
            query = query.where(Product.subcategory_id == subcategory_id)
        if operational_status:
            query = query.where(Product.operational_status == operational_status)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.style_code.ilike(search_pattern),
                    Product.qr_code.ilike(search_pattern),
                    Product.material.ilike(search_pattern),
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_query)).scalar() or 0

        query = (
            query.order_by(Product.created_at.desc())
            .options(
                selectinload(Product.category),
                selectinload(Product.subcategory),
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.size),
                selectinload(Product.variants).selectinload(ProductVariant.color),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(query)
        items = result.scalars().all()

        return items, total

    async def find_expired_retention_products(self, cutoff_date: datetime) -> Sequence[Product]:
        """
        Find products eligible for 2-year retention cleanup:
        - (manual_sold_out is True and sold_out_at <= cutoff_date) OR
        - (is_damaged is True and damaged_at <= cutoff_date)
        where is_retired is False.
        """
        stmt = select(Product).where(
            Product.is_retired.is_(False),
            or_(
                (Product.manual_sold_out.is_(True))
                & (Product.sold_out_at.is_not(None))
                & (Product.sold_out_at <= cutoff_date),
                (Product.is_damaged.is_(True))
                & (Product.damaged_at.is_not(None))
                & (Product.damaged_at <= cutoff_date),
            ),
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    # --- Image Repository Methods ---
    async def count_product_images(self, product_id: uuid.UUID) -> int:
        count = (
            await self.session.execute(
                select(func.count(ProductImage.id)).where(ProductImage.product_id == product_id)
            )
        ).scalar() or 0
        return count

    async def get_image_by_id(self, image_id: uuid.UUID) -> ProductImage | None:
        return await self.session.get(ProductImage, image_id)

    async def create_image(self, image: ProductImage) -> ProductImage:
        self.session.add(image)
        await self.session.flush()
        return image

    async def delete_image(self, image: ProductImage) -> None:
        await self.session.delete(image)
        await self.session.flush()

    # --- Variant Repository Methods ---
    async def get_variant_by_id(self, variant_id: uuid.UUID) -> ProductVariant | None:
        return await self.session.get(ProductVariant, variant_id)

    async def create_variant(self, variant: ProductVariant) -> ProductVariant:
        self.session.add(variant)
        await self.session.flush()
        return variant

    async def bulk_create_variants(
        self, variants: list[ProductVariant]
    ) -> Sequence[ProductVariant]:
        self.session.add_all(variants)
        await self.session.flush()
        return variants

    async def delete_variant(self, variant: ProductVariant) -> None:
        await self.session.delete(variant)
        await self.session.flush()
