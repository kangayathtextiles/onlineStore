import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.taxonomy import Category, Subcategory
from app.repositories.base import BaseRepository


class TaxonomyRepository(BaseRepository[Category]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Category, session)

    async def get_by_slug(self, slug: str) -> Category | None:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Category)
            .where(Category.slug == slug)
            .options(selectinload(Category.subcategories))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_categories(self, active_only: bool = False) -> Sequence[Category]:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Category)
            .order_by(Category.display_order)
            .options(selectinload(Category.subcategories))
        )
        if active_only:
            stmt = stmt.where(Category.is_active.is_(True))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_category_dependencies(self, category_id: uuid.UUID) -> tuple[int, int]:
        """Returns count of (subcategories, products) referencing this category."""
        sub_count = (
            await self.session.execute(
                select(func.count(Subcategory.id)).where(Subcategory.category_id == category_id)
            )
        ).scalar() or 0

        prod_count = (
            await self.session.execute(
                select(func.count(Product.id)).where(Product.category_id == category_id)
            )
        ).scalar() or 0

        return sub_count, prod_count

    # Subcategory operations
    async def get_subcategory_by_id(self, subcategory_id: uuid.UUID) -> Subcategory | None:
        return await self.session.get(Subcategory, subcategory_id)

    async def get_subcategory_by_slug(self, slug: str) -> Subcategory | None:
        stmt = select(Subcategory).where(Subcategory.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_subcategories(
        self, category_id: uuid.UUID | None = None, active_only: bool = False
    ) -> Sequence[Subcategory]:
        stmt = select(Subcategory).order_by(Subcategory.display_order)
        if category_id:
            stmt = stmt.where(Subcategory.category_id == category_id)
        if active_only:
            stmt = stmt.where(Subcategory.is_active.is_(True))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_subcategory_products(self, subcategory_id: uuid.UUID) -> int:
        count = (
            await self.session.execute(
                select(func.count(Product.id)).where(Product.subcategory_id == subcategory_id)
            )
        ).scalar() or 0
        return count
