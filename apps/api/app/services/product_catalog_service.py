"""
Domain service for querying public and admin product catalogs:
filtering, pagination, slug resolution, and visibility policy.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundException
from app.models.enums import LifecycleState
from app.repositories.product_repository import ProductRepository
from app.repositories.store_repository import StoreRepository
from app.schemas.common import PaginatedResponse
from app.schemas.product import (
    AdminProductResponse,
    PublicProductDetailResponse,
    PublicProductSummaryResponse,
)
from app.services.product_presenter import (
    map_to_admin_response,
    map_to_public_detail,
    map_to_public_summary,
)


class ProductCatalogService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProductRepository(session)
        self.store_repo = StoreRepository(session)

    async def get_global_visibility_settings(self) -> tuple[bool, bool]:
        """Fetch store profile once and return (show_prices, show_style_codes)."""
        store = await self.store_repo.get_singleton_profile()
        return (
            store.show_prices if store else True,
            store.show_style_codes if store else True,
        )

    async def get_global_show_prices(self) -> bool:
        store = await self.store_repo.get_singleton_profile()
        return store.show_prices if store else True

    async def get_global_show_style_codes(self) -> bool:
        store = await self.store_repo.get_singleton_profile()
        return store.show_style_codes if store else True

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
    ) -> PaginatedResponse[PublicProductSummaryResponse]:
        global_show_prices, global_show_style_codes = await self.get_global_visibility_settings()
        items, total = await self.repo.list_public_products(
            category_slug=category_slug,
            subcategory_slug=subcategory_slug,
            size_id=size_id,
            color_id=color_id,
            available_only=available_only,
            search=search,
            page=page,
            page_size=page_size,
        )
        mapped = [
            map_to_public_summary(
                p,
                global_show_prices=global_show_prices,
                global_show_style_codes=global_show_style_codes,
            )
            for p in items
        ]
        return PaginatedResponse.create(mapped, total, page, page_size)

    async def get_public_product_by_slug(self, slug: str) -> PublicProductDetailResponse:
        global_show_prices, global_show_style_codes = await self.get_global_visibility_settings()
        product = await self.repo.get_published_by_slug(slug)
        if not product:
            raise EntityNotFoundException("Product", slug)
        return map_to_public_detail(
            product,
            global_show_prices=global_show_prices,
            global_show_style_codes=global_show_style_codes,
        )

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
    ) -> PaginatedResponse[AdminProductResponse]:
        items, total = await self.repo.list_admin_products(
            lifecycle_state=lifecycle_state,
            category_id=category_id,
            subcategory_id=subcategory_id,
            operational_status=operational_status,
            include_retired=include_retired,
            search=search,
            page=page,
            page_size=page_size,
        )
        mapped = [map_to_admin_response(p) for p in items]
        return PaginatedResponse.create(mapped, total, page, page_size)

    async def get_admin_product_by_id(self, product_id: uuid.UUID) -> AdminProductResponse:
        self.session.expire_all()
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        return map_to_admin_response(product)
