"""
Domain service for managing garment variants:
matrix generation, single variant creation, availability toggles, and deletion.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceException, EntityNotFoundException
from app.models.variant import ProductVariant
from app.repositories.product_repository import ProductRepository
from app.schemas.product import (
    AdminProductResponse,
    VariantAvailabilityUpdate,
    VariantCreateRequest,
    VariantMatrixGenerateRequest,
)
from app.services.product_presenter import map_to_admin_response


class ProductVariantService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProductRepository(session)

    async def get_admin_product_by_id(self, product_id: uuid.UUID) -> AdminProductResponse:
        self.session.expire_all()
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        return map_to_admin_response(product)

    async def generate_variant_matrix(
        self, product_id: uuid.UUID, req: VariantMatrixGenerateRequest
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        existing_combos = {(v.size_id, v.color_id) for v in product.variants}

        new_variants: list[ProductVariant] = []
        for s_id in req.size_ids:
            for c_id in req.color_ids:
                if (s_id, c_id) not in existing_combos:
                    new_variants.append(
                        ProductVariant(
                            product_id=product_id,
                            size_id=s_id,
                            color_id=c_id,
                            is_available=req.default_available,
                        )
                    )

        if new_variants:
            await self.repo.bulk_create_variants(new_variants)
            await self.session.commit()

        return await self.get_admin_product_by_id(product_id)

    async def add_single_variant(
        self, product_id: uuid.UUID, req: VariantCreateRequest
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        for v in product.variants:
            if v.size_id == req.size_id and v.color_id == req.color_id:
                raise DuplicateResourceException(
                    "ProductVariant", "combination", f"{req.size_id}/{req.color_id}"
                )

        variant = ProductVariant(
            product_id=product_id,
            size_id=req.size_id,
            color_id=req.color_id,
            sku=req.sku,
            is_available=req.is_available,
        )
        await self.repo.create_variant(variant)
        await self.session.commit()
        return await self.get_admin_product_by_id(product_id)

    async def update_variant_availability(
        self, product_id: uuid.UUID, variant_id: uuid.UUID, req: VariantAvailabilityUpdate
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        variant = await self.repo.get_variant_by_id(variant_id)
        if not variant or variant.product_id != product_id:
            raise EntityNotFoundException("ProductVariant", variant_id)

        variant.is_available = req.is_available
        await self.session.commit()
        return await self.get_admin_product_by_id(product_id)

    async def delete_variant(
        self, product_id: uuid.UUID, variant_id: uuid.UUID
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        variant = await self.repo.get_variant_by_id(variant_id)
        if not variant or variant.product_id != product_id:
            raise EntityNotFoundException("ProductVariant", variant_id)

        await self.repo.delete_variant(variant)
        await self.session.commit()
        return await self.get_admin_product_by_id(product_id)
