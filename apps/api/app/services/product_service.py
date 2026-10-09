import uuid
from datetime import UTC, datetime

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DuplicateResourceException,
    EntityNotFoundException,
    InvariantViolationException,
)
from app.models.enums import LifecycleEventType, LifecycleState
from app.models.lifecycle_log import ProductLifecycleLog
from app.models.product import Product
from app.repositories.attribute_repository import AttributeRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.taxonomy_repository import TaxonomyRepository
from app.schemas.common import PaginatedResponse
from app.schemas.product import (
    AdminProductResponse,
    ProductCreateRequest,
    ProductImageCreate,
    ProductImageReorderRequest,
    ProductLifecycleUpdate,
    ProductSoldOutUpdate,
    ProductUpdateRequest,
    PublicProductDetailResponse,
    PublicProductSummaryResponse,
    QRActionRequest,
    QRCleanupResponse,
    QRPrintItemDTO,
    QRScanResponse,
    VariantAvailabilityUpdate,
    VariantCreateRequest,
    VariantMatrixGenerateRequest,
)
from app.services.media_service import ProductMediaService
from app.services.product_catalog_service import ProductCatalogService
from app.services.product_presenter import (
    calculate_availability,
    map_to_admin_response,
    map_to_public_detail,
    map_to_public_summary,
    should_show_price,
)
from app.services.product_variant_service import ProductVariantService
from app.services.qr_lifecycle_service import QRLifecycleService
from app.services.qr_service import generate_qr_code, generate_style_code
from app.services.taxonomy_service import slugify


class ProductService:
    """
    Core domain service managing product creation, updates, and lifecycle transitions.
    Delegates catalog queries, variants, media, and QR identities to specialized services.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProductRepository(session)
        self.taxonomy_repo = TaxonomyRepository(session)
        self.attr_repo = AttributeRepository(session)
        self.catalog_service = ProductCatalogService(session)
        self.variant_service = ProductVariantService(session)
        self.qr_service = QRLifecycleService(session)
        self.media_service = ProductMediaService(session, self.get_admin_product_by_id)

    # --- Backwards-compatible Helper Bindings & Static Methods ---
    calculate_availability = staticmethod(calculate_availability)
    should_show_price = staticmethod(should_show_price)

    @staticmethod
    def map_to_public_summary(
        product: Product,
        global_show_prices: bool = True,
        global_show_style_codes: bool = True,
    ) -> PublicProductSummaryResponse:
        return map_to_public_summary(
            product,
            global_show_prices=global_show_prices,
            global_show_style_codes=global_show_style_codes,
        )

    @staticmethod
    def map_to_public_detail(
        product: Product,
        global_show_prices: bool = True,
        global_show_style_codes: bool = True,
    ) -> PublicProductDetailResponse:
        return map_to_public_detail(
            product,
            global_show_prices=global_show_prices,
            global_show_style_codes=global_show_style_codes,
        )

    @staticmethod
    def map_to_admin_response(product: Product) -> AdminProductResponse:
        return map_to_admin_response(product)

    def map_to_qr_scan_response(self, product: Product) -> QRScanResponse:
        return self.qr_service.map_to_qr_scan_response(product)

    # --- Catalog Queries (Delegated to ProductCatalogService) ---
    async def get_global_visibility_settings(self) -> tuple[bool, bool]:
        return await self.catalog_service.get_global_visibility_settings()

    async def get_global_show_prices(self) -> bool:
        return await self.catalog_service.get_global_show_prices()

    async def get_global_show_style_codes(self) -> bool:
        return await self.catalog_service.get_global_show_style_codes()

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
        return await self.catalog_service.list_public_products(
            category_slug=category_slug,
            subcategory_slug=subcategory_slug,
            size_id=size_id,
            color_id=color_id,
            available_only=available_only,
            search=search,
            page=page,
            page_size=page_size,
        )

    async def get_public_product_by_slug(self, slug: str) -> PublicProductDetailResponse:
        return await self.catalog_service.get_public_product_by_slug(slug)

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
        return await self.catalog_service.list_admin_products(
            lifecycle_state=lifecycle_state,
            category_id=category_id,
            subcategory_id=subcategory_id,
            operational_status=operational_status,
            include_retired=include_retired,
            search=search,
            page=page,
            page_size=page_size,
        )

    async def get_admin_product_by_id(self, product_id: uuid.UUID) -> AdminProductResponse:
        return await self.catalog_service.get_admin_product_by_id(product_id)

    # --- Product Command Operations (Creation, Mutations & Deletion) ---
    async def create_product(self, data: ProductCreateRequest) -> AdminProductResponse:
        # Validate taxonomy foreign keys
        cat = await self.taxonomy_repo.get_by_id(data.category_id)
        if not cat:
            raise EntityNotFoundException("Category", data.category_id)
        sub = await self.taxonomy_repo.get_subcategory_by_id(data.subcategory_id)
        if not sub or sub.category_id != data.category_id:
            raise InvariantViolationException("Subcategory does not belong to specified Category.")

        slug = data.slug or slugify(data.name)
        existing = await self.repo.get_by_slug(slug)
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        # Auto-generate unique Style Code
        style_code = data.style_code or generate_style_code(cat.slug, sub.slug)
        for _ in range(5):
            existing_style = await self.repo.get_by_style_code(style_code)
            if not existing_style:
                break
            style_code = generate_style_code(cat.slug, sub.slug)

        # Auto-generate unique QR Code
        qr_code = generate_qr_code()
        for _ in range(5):
            existing_qr = await self.repo.get_by_qr_code(qr_code)
            if not existing_qr:
                break
            qr_code = generate_qr_code()

        product = Product(
            category_id=data.category_id,
            subcategory_id=data.subcategory_id,
            name=data.name,
            slug=slug,
            description=data.description,
            material=data.material,
            style_code=style_code,
            qr_code=qr_code,
            qr_status="ACTIVE",
            operational_status="AVAILABLE",
            is_damaged=False,
            is_retired=False,
            lifecycle_state=data.lifecycle_state,
            manual_sold_out=data.manual_sold_out,
            featured=data.featured,
            price=data.price,
            show_price=data.show_price,
            meta_title=data.meta_title,
            meta_description=data.meta_description,
        )
        await self.repo.create(product)

        # Record initial lifecycle creation log
        log = ProductLifecycleLog(
            product_id=product.id,
            event_type=LifecycleEventType.CREATED,
            from_status=None,
            to_status="AVAILABLE",
            qr_code=qr_code,
            style_code=style_code,
            notes="Product created with automatic Style Code and QR Code identity.",
        )
        self.session.add(log)

        await self.session.commit()
        await self.session.refresh(product)
        return map_to_admin_response(product)

    async def update_product(
        self, product_id: uuid.UUID, data: ProductUpdateRequest
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        if data.category_id is not None:
            cat = await self.taxonomy_repo.get_by_id(data.category_id)
            if not cat:
                raise EntityNotFoundException("Category", data.category_id)
            product.category_id = data.category_id

        if data.subcategory_id is not None:
            sub = await self.taxonomy_repo.get_subcategory_by_id(data.subcategory_id)
            if not sub:
                raise EntityNotFoundException("Subcategory", data.subcategory_id)
            product.subcategory_id = data.subcategory_id

        if data.name is not None:
            product.name = data.name
        if data.slug is not None:
            slug = slugify(data.slug)
            existing = await self.repo.get_by_slug(slug)
            if existing and existing.id != product_id:
                raise DuplicateResourceException("Product", "slug", slug)
            product.slug = slug
        if data.description is not None:
            product.description = data.description
        if data.material is not None:
            product.material = data.material
        if data.lifecycle_state is not None:
            product.lifecycle_state = data.lifecycle_state
        if data.manual_sold_out is not None:
            old_sold_out = product.manual_sold_out
            product.manual_sold_out = data.manual_sold_out
            if data.manual_sold_out and not old_sold_out:
                product.operational_status = "SOLD_OUT"
                product.sold_out_at = datetime.now(UTC)
                self.session.add(
                    ProductLifecycleLog(
                        product_id=product.id,
                        event_type=LifecycleEventType.SOLD_OUT,
                        from_status="AVAILABLE",
                        to_status="SOLD_OUT",
                        qr_code=product.qr_code,
                        style_code=product.style_code,
                        notes="Marked sold out via product edit.",
                    )
                )
            elif not data.manual_sold_out and old_sold_out:
                product.operational_status = "AVAILABLE"
                product.sold_out_at = None
                self.session.add(
                    ProductLifecycleLog(
                        product_id=product.id,
                        event_type=LifecycleEventType.RETURNED,
                        from_status="SOLD_OUT",
                        to_status="AVAILABLE",
                        qr_code=product.qr_code,
                        style_code=product.style_code,
                        notes="Marked back in stock via product edit.",
                    )
                )
        if data.featured is not None:
            product.featured = data.featured
        if "price" in data.model_fields_set:
            product.price = data.price
        if data.show_price is not None:
            product.show_price = data.show_price
        if data.meta_title is not None:
            product.meta_title = data.meta_title
        if data.meta_description is not None:
            product.meta_description = data.meta_description

        await self.session.commit()
        return await self.get_admin_product_by_id(product.id)

    async def update_lifecycle_state(
        self, product_id: uuid.UUID, data: ProductLifecycleUpdate
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        product.lifecycle_state = data.lifecycle_state
        await self.session.commit()
        return await self.get_admin_product_by_id(product_id)

    async def update_sold_out_state(
        self, product_id: uuid.UUID, data: ProductSoldOutUpdate
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        old_sold = product.manual_sold_out
        product.manual_sold_out = data.manual_sold_out
        if data.manual_sold_out and not old_sold:
            product.operational_status = "SOLD_OUT"
            product.sold_out_at = datetime.now(UTC)
            self.session.add(
                ProductLifecycleLog(
                    product_id=product.id,
                    event_type=LifecycleEventType.SOLD_OUT,
                    from_status="AVAILABLE",
                    to_status="SOLD_OUT",
                    qr_code=product.qr_code,
                    style_code=product.style_code,
                    notes="Sold out toggled in catalog.",
                )
            )
        elif not data.manual_sold_out and old_sold:
            product.operational_status = "AVAILABLE"
            product.sold_out_at = None
            self.session.add(
                ProductLifecycleLog(
                    product_id=product.id,
                    event_type=LifecycleEventType.RETURNED,
                    from_status="SOLD_OUT",
                    to_status="AVAILABLE",
                    qr_code=product.qr_code,
                    style_code=product.style_code,
                    notes="Back in stock toggled in catalog.",
                )
            )
        await self.session.commit()
        return await self.get_admin_product_by_id(product_id)

    async def delete_product(self, product_id: uuid.UUID) -> None:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        await self.repo.delete(product)
        await self.session.commit()

    # --- Delegations (QR, Media, Variants) ---
    async def lookup_by_qr(self, qr_code: str) -> QRScanResponse:
        return await self.qr_service.lookup_by_qr(qr_code)

    async def execute_qr_action(self, data: QRActionRequest) -> QRScanResponse:
        return await self.qr_service.execute_qr_action(data)

    async def get_qr_print_data(
        self,
        category_id: uuid.UUID | None = None,
        subcategory_id: uuid.UUID | None = None,
        operational_status: str | None = None,
        search: str | None = None,
    ) -> list[QRPrintItemDTO]:
        return await self.qr_service.get_qr_print_data(
            category_id=category_id,
            subcategory_id=subcategory_id,
            operational_status=operational_status,
            search=search,
        )

    async def cleanup_expired_products(self, retention_years: int = 2) -> QRCleanupResponse:
        return await self.qr_service.cleanup_expired_products(retention_years)

    async def add_image(
        self, product_id: uuid.UUID, data: ProductImageCreate
    ) -> AdminProductResponse:
        return await self.media_service.add_image(product_id, data)

    async def upload_image(
        self,
        product_id: uuid.UUID,
        file: UploadFile,
        is_primary: bool = False,
        alt_text: str | None = None,
    ) -> AdminProductResponse:
        return await self.media_service.upload_image(
            product_id=product_id,
            file=file,
            is_primary=is_primary,
            alt_text=alt_text,
        )

    async def delete_image(
        self, product_id: uuid.UUID, image_id: uuid.UUID
    ) -> AdminProductResponse:
        return await self.media_service.delete_image(product_id, image_id)

    async def reorder_images(
        self, product_id: uuid.UUID, req: ProductImageReorderRequest
    ) -> AdminProductResponse:
        return await self.media_service.reorder_images(product_id, req)

    async def generate_variant_matrix(
        self, product_id: uuid.UUID, req: VariantMatrixGenerateRequest
    ) -> AdminProductResponse:
        return await self.variant_service.generate_variant_matrix(product_id, req)

    async def add_single_variant(
        self, product_id: uuid.UUID, req: VariantCreateRequest
    ) -> AdminProductResponse:
        return await self.variant_service.add_single_variant(product_id, req)

    async def update_variant_availability(
        self, product_id: uuid.UUID, variant_id: uuid.UUID, req: VariantAvailabilityUpdate
    ) -> AdminProductResponse:
        return await self.variant_service.update_variant_availability(product_id, variant_id, req)

    async def delete_variant(
        self, product_id: uuid.UUID, variant_id: uuid.UUID
    ) -> AdminProductResponse:
        return await self.variant_service.delete_variant(product_id, variant_id)
