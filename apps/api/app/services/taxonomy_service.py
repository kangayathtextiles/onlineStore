import re
import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    CategoryHasDependenciesException,
    DuplicateResourceException,
    EntityNotFoundException,
    InvariantViolationException,
)
from app.models.taxonomy import Category, Subcategory
from app.repositories.taxonomy_repository import TaxonomyRepository
from app.schemas.taxonomy import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    PublicCategoryTreeResponse,
    SubcategoryCreate,
    SubcategorySummaryDTO,
    SubcategoryUpdate,
)


def slugify(text: str) -> str:
    """Converts a human-readable title into a clean URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


class TaxonomyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = TaxonomyRepository(session)

    # --- Categories ---
    async def list_public_categories(self) -> list[PublicCategoryTreeResponse]:
        categories = await self.repo.list_categories(active_only=True)
        return [
            PublicCategoryTreeResponse(
                id=c.id,
                name=c.name,
                slug=c.slug,
                description=c.description,
                thumbnail_url=c.thumbnail_url,
                display_order=c.display_order,
                subcategories=[
                    SubcategorySummaryDTO(
                        id=sub.id,
                        category_id=sub.category_id,
                        name=sub.name,
                        slug=sub.slug,
                        display_order=sub.display_order,
                        is_active=sub.is_active,
                    )
                    for sub in c.subcategories
                    if sub.is_active
                ],
            )
            for c in categories
        ]

    async def list_admin_categories(self) -> list[CategoryResponse]:
        categories = await self.repo.list_categories(active_only=False)
        return [
            CategoryResponse(
                id=c.id,
                name=c.name,
                slug=c.slug,
                description=c.description,
                thumbnail_url=c.thumbnail_url,
                display_order=c.display_order,
                is_active=c.is_active,
                created_at=c.created_at,
                updated_at=c.updated_at,
                subcategories=[
                    SubcategorySummaryDTO(
                        id=sub.id,
                        category_id=sub.category_id,
                        name=sub.name,
                        slug=sub.slug,
                        display_order=sub.display_order,
                        is_active=sub.is_active,
                    )
                    for sub in c.subcategories
                ],
            )
            for c in categories
        ]

    async def get_category_by_id(self, category_id: uuid.UUID) -> Category:
        category = await self.repo.get_by_id(category_id)
        if not category:
            raise EntityNotFoundException("Category", category_id)
        return category

    async def create_category(self, data: CategoryCreate) -> Category:
        slug = data.slug or slugify(data.name)
        existing = await self.repo.get_by_slug(slug)
        if existing:
            raise DuplicateResourceException("Category", "slug", slug)

        category = Category(
            name=data.name,
            slug=slug,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            display_order=data.display_order,
            is_active=data.is_active,
        )
        await self.repo.create(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def update_category(self, category_id: uuid.UUID, data: CategoryUpdate) -> Category:
        category = await self.get_category_by_id(category_id)

        if data.name is not None:
            category.name = data.name
        if data.slug is not None:
            slug = slugify(data.slug)
            existing = await self.repo.get_by_slug(slug)
            if existing and existing.id != category_id:
                raise DuplicateResourceException("Category", "slug", slug)
            category.slug = slug
        if data.description is not None:
            category.description = data.description
        if data.thumbnail_url is not None:
            category.thumbnail_url = data.thumbnail_url
        if data.display_order is not None:
            category.display_order = data.display_order
        if data.is_active is not None:
            category.is_active = data.is_active

        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def delete_category(self, category_id: uuid.UUID) -> None:
        category = await self.get_category_by_id(category_id)
        sub_count, prod_count = await self.repo.count_category_dependencies(category_id)

        if sub_count > 0 or prod_count > 0:
            raise CategoryHasDependenciesException(
                category_name=category.name,
                active_subcategories=sub_count,
                active_products=prod_count,
            )

        await self.repo.delete(category)
        await self.session.commit()

    # --- Subcategories ---
    async def list_subcategories(
        self, category_id: uuid.UUID | None = None
    ) -> Sequence[Subcategory]:
        return await self.repo.list_subcategories(category_id=category_id, active_only=False)

    async def create_subcategory(self, data: SubcategoryCreate) -> Subcategory:
        # Check category existence
        await self.get_category_by_id(data.category_id)

        slug = data.slug or slugify(f"{data.name}")
        existing = await self.repo.get_subcategory_by_slug(slug)
        if existing:
            raise DuplicateResourceException("Subcategory", "slug", slug)

        subcategory = Subcategory(
            category_id=data.category_id,
            name=data.name,
            slug=slug,
            display_order=data.display_order,
            is_active=data.is_active,
        )
        self.session.add(subcategory)
        await self.session.commit()
        await self.session.refresh(subcategory)
        return subcategory

    async def update_subcategory(
        self, subcategory_id: uuid.UUID, data: SubcategoryUpdate
    ) -> Subcategory:
        subcategory = await self.repo.get_subcategory_by_id(subcategory_id)
        if not subcategory:
            raise EntityNotFoundException("Subcategory", subcategory_id)

        if data.name is not None:
            subcategory.name = data.name
        if data.slug is not None:
            slug = slugify(data.slug)
            existing = await self.repo.get_subcategory_by_slug(slug)
            if existing and existing.id != subcategory_id:
                raise DuplicateResourceException("Subcategory", "slug", slug)
            subcategory.slug = slug
        if data.display_order is not None:
            subcategory.display_order = data.display_order
        if data.is_active is not None:
            subcategory.is_active = data.is_active

        await self.session.commit()
        await self.session.refresh(subcategory)
        return subcategory

    async def delete_subcategory(self, subcategory_id: uuid.UUID) -> None:
        subcategory = await self.repo.get_subcategory_by_id(subcategory_id)
        if not subcategory:
            raise EntityNotFoundException("Subcategory", subcategory_id)

        prod_count = await self.repo.count_subcategory_products(subcategory_id)
        if prod_count > 0:
            raise InvariantViolationException(
                message=f"Cannot delete subcategory '{subcategory.name}' because {prod_count} products belong to it.",
                code="SUBCATEGORY_HAS_ACTIVE_PRODUCTS",
                details={"active_products": prod_count},
            )

        await self.session.delete(subcategory)
        await self.session.commit()
