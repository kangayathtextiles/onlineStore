import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceException, EntityNotFoundException
from app.models.custom_section import CustomSection, CustomSectionItem
from app.models.enums import LifecycleState
from app.repositories.custom_section_repository import CustomSectionRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.custom_section import (
    AdminSectionResponse,
    CustomSectionItemDTO,
    PublicSectionResponse,
    SectionCreateRequest,
    SectionItemReorderRequest,
    SectionUpdateRequest,
)
from app.services.product_service import ProductService
from app.services.taxonomy_service import slugify


class CustomSectionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = CustomSectionRepository(session)
        self.product_repo = ProductRepository(session)
        self.product_service = ProductService(session)

    # --- Public APIs ---
    async def list_public_sections(self) -> list[PublicSectionResponse]:
        sections = await self.repo.list_sections(active_only=True)
        global_show_prices = await self.product_service.get_global_show_prices()
        results: list[PublicSectionResponse] = []

        for sec in sections:
            # Filter published products
            published_products = [
                self.product_service.map_to_public_summary(
                    item.product, global_show_prices=global_show_prices
                )
                for item in sec.items
                if item.product
                and item.product.lifecycle_state == LifecycleState.PUBLISHED
                and item.product.category
                and item.product.category.is_active
            ]
            results.append(
                PublicSectionResponse(
                    id=sec.id,
                    title=sec.title,
                    slug=sec.slug,
                    subtitle=sec.subtitle,
                    banner_image_url=sec.banner_image_url,
                    display_order=sec.display_order,
                    products=published_products,
                )
            )
        return results

    async def get_public_section_by_slug(self, slug: str) -> PublicSectionResponse:
        sec = await self.repo.get_by_slug(slug)
        if not sec or not sec.is_active:
            raise EntityNotFoundException("CustomSection", slug)

        global_show_prices = await self.product_service.get_global_show_prices()
        published_products = [
            self.product_service.map_to_public_summary(
                item.product, global_show_prices=global_show_prices
            )
            for item in sec.items
            if item.product
            and item.product.lifecycle_state == LifecycleState.PUBLISHED
            and item.product.category
            and item.product.category.is_active
        ]
        return PublicSectionResponse(
            id=sec.id,
            title=sec.title,
            slug=sec.slug,
            subtitle=sec.subtitle,
            banner_image_url=sec.banner_image_url,
            display_order=sec.display_order,
            products=published_products,
        )

    # --- Admin APIs ---
    async def list_admin_sections(self) -> list[AdminSectionResponse]:
        sections = await self.repo.list_sections(active_only=False)
        return [self.map_to_admin_response(s) for s in sections]

    async def get_admin_section_by_id(self, section_id: uuid.UUID) -> AdminSectionResponse:
        sec = await self.repo.get_by_id(section_id)
        if not sec:
            raise EntityNotFoundException("CustomSection", section_id)
        return self.map_to_admin_response(sec)

    async def create_section(self, req: SectionCreateRequest) -> AdminSectionResponse:
        slug = req.slug or slugify(req.title)
        existing = await self.repo.get_by_slug(slug)
        if existing:
            raise DuplicateResourceException("CustomSection", "slug", slug)

        section = CustomSection(
            title=req.title,
            slug=slug,
            subtitle=req.subtitle,
            banner_image_url=req.banner_image_url,
            is_active=req.is_active,
            display_order=req.display_order,
        )
        await self.repo.create(section)

        if req.product_ids:
            items = [
                CustomSectionItem(
                    section_id=section.id,
                    product_id=pid,
                    sort_order=idx,
                )
                for idx, pid in enumerate(req.product_ids)
            ]
            await self.repo.add_section_items(items)

        await self.session.commit()
        refreshed_sec = await self.repo.get_by_id(section.id)
        assert refreshed_sec is not None
        return self.map_to_admin_response(refreshed_sec)

    async def update_section(
        self, section_id: uuid.UUID, req: SectionUpdateRequest
    ) -> AdminSectionResponse:
        sec = await self.repo.get_by_id(section_id)
        if not sec:
            raise EntityNotFoundException("CustomSection", section_id)

        if req.title is not None:
            sec.title = req.title
        if req.slug is not None:
            slug = slugify(req.slug)
            existing = await self.repo.get_by_slug(slug)
            if existing and existing.id != section_id:
                raise DuplicateResourceException("CustomSection", "slug", slug)
            sec.slug = slug
        if req.subtitle is not None:
            sec.subtitle = req.subtitle
        if req.banner_image_url is not None:
            sec.banner_image_url = req.banner_image_url
        if req.is_active is not None:
            sec.is_active = req.is_active
        if req.display_order is not None:
            sec.display_order = req.display_order

        await self.session.commit()
        refreshed_sec = await self.repo.get_by_id(section_id)
        assert refreshed_sec is not None
        return self.map_to_admin_response(refreshed_sec)

    async def reorder_section_items(
        self, section_id: uuid.UUID, req: SectionItemReorderRequest
    ) -> AdminSectionResponse:
        sec = await self.repo.get_by_id(section_id)
        if not sec:
            raise EntityNotFoundException("CustomSection", section_id)

        # Clear and re-populate directly on collection
        sec.items.clear()
        await self.session.flush()

        for item in req.items:
            sec.items.append(
                CustomSectionItem(
                    section_id=section_id,
                    product_id=item.product_id,
                    sort_order=item.sort_order,
                )
            )

        await self.session.commit()
        refreshed_sec = await self.repo.get_by_id(section_id)
        assert refreshed_sec is not None
        return self.map_to_admin_response(refreshed_sec)

    async def delete_section(self, section_id: uuid.UUID) -> None:
        sec = await self.repo.get_by_id(section_id)
        if not sec:
            raise EntityNotFoundException("CustomSection", section_id)
        await self.repo.delete(sec)
        await self.session.commit()

    def map_to_admin_response(self, sec: CustomSection) -> AdminSectionResponse:
        items_dto: list[CustomSectionItemDTO] = []
        for item in sec.items:
            p = item.product
            primary_img = (
                next((img.url for img in p.images if img.is_primary), None)
                if p and p.images
                else None
            )
            items_dto.append(
                CustomSectionItemDTO(
                    id=item.id,
                    section_id=item.section_id,
                    product_id=item.product_id,
                    sort_order=item.sort_order,
                    created_at=item.created_at,
                    product_name=p.name if p else None,
                    product_slug=p.slug if p else None,
                    product_image_url=primary_img,
                    is_available=self.product_service.calculate_availability(p) if p else False,
                )
            )

        return AdminSectionResponse(
            id=sec.id,
            title=sec.title,
            slug=sec.slug,
            subtitle=sec.subtitle,
            banner_image_url=sec.banner_image_url,
            is_active=sec.is_active,
            display_order=sec.display_order,
            created_at=sec.created_at,
            updated_at=sec.updated_at,
            items=items_dto,
        )
