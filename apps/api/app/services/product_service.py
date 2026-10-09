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
from app.models.variant import ProductVariant
from app.repositories.attribute_repository import AttributeRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.store_repository import StoreRepository
from app.repositories.taxonomy_repository import TaxonomyRepository
from app.schemas.attribute import ColorOptionDTO, SizeOptionDTO
from app.schemas.common import PaginatedResponse
from app.schemas.product import (
    AdminProductResponse,
    ProductCreateRequest,
    ProductImageCreate,
    ProductImageDTO,
    ProductImageReorderRequest,
    ProductLifecycleUpdate,
    ProductSoldOutUpdate,
    ProductUpdateRequest,
    ProductVariantDTO,
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
from app.schemas.taxonomy import SubcategorySummaryDTO
from app.services.media_service import ProductMediaService
from app.services.qr_lifecycle_service import QRLifecycleService
from app.services.qr_service import generate_qr_code, generate_style_code
from app.services.taxonomy_service import slugify


class ProductService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProductRepository(session)
        self.taxonomy_repo = TaxonomyRepository(session)
        self.attr_repo = AttributeRepository(session)
        self.store_repo = StoreRepository(session)
        self.qr_service = QRLifecycleService(session)
        self.media_service = ProductMediaService(session, self.get_admin_product_by_id)

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

    # --- Helper: Calculate Price Visibility (Three-Tier Precedence) ---
    @staticmethod
    def should_show_price(
        product: Product,
        global_show_prices: bool = True,
    ) -> bool:
        # Precedence 1: Global OFF -> All customer prices hidden
        if not global_show_prices:
            return False
        # Precedence 2: Category OFF -> Prices in that category hidden
        if product.category and not product.category.show_prices:
            return False
        # Precedence 3: Product OFF -> That product price hidden
        if not product.show_price:
            return False
        return True

    # --- Helper: Calculate Product Availability ---
    @staticmethod
    def calculate_availability(product: Product) -> bool:
        if product.manual_sold_out or product.is_damaged or product.is_retired:
            return False
        if not product.variants:
            return True  # If no variants defined, default available unless manual sold out
        return any(v.is_available for v in product.variants)

    # --- Mapping Helpers ---
    def map_to_public_summary(
        self,
        product: Product,
        global_show_prices: bool = True,
        global_show_style_codes: bool = True,
    ) -> PublicProductSummaryResponse:
        primary_img = next((img.url for img in product.images if img.is_primary), None)
        if not primary_img and product.images:
            primary_img = product.images[0].url

        available_sizes = sorted(
            {v.size.name for v in product.variants if v.is_available and v.size is not None}
        )
        available_colors = sorted(
            {v.color.name for v in product.variants if v.is_available and v.color is not None}
        )

        visible_price = (
            product.price if self.should_show_price(product, global_show_prices) else None
        )
        visible_style_code = product.style_code if global_show_style_codes else None

        return PublicProductSummaryResponse(
            id=product.id,
            name=product.name,
            slug=product.slug,
            material=product.material,
            style_code=visible_style_code,
            featured=product.featured,
            is_available=self.calculate_availability(product),
            primary_image_url=primary_img,
            category_name=product.category.name if product.category else None,
            category_slug=product.category.slug if product.category else None,
            subcategory_name=product.subcategory.name if product.subcategory else None,
            subcategory_slug=product.subcategory.slug if product.subcategory else None,
            available_sizes=available_sizes,
            available_colors=available_colors,
            price=visible_price,
        )

    def map_to_public_detail(
        self,
        product: Product,
        global_show_prices: bool = True,
        global_show_style_codes: bool = True,
    ) -> PublicProductDetailResponse:
        visible_price = (
            product.price if self.should_show_price(product, global_show_prices) else None
        )
        visible_style_code = product.style_code if global_show_style_codes else None
        return PublicProductDetailResponse(
            id=product.id,
            name=product.name,
            slug=product.slug,
            description=product.description,
            material=product.material,
            style_code=visible_style_code,
            featured=product.featured,
            is_available=self.calculate_availability(product),
            meta_title=product.meta_title,
            meta_description=product.meta_description,
            category_name=product.category.name if product.category else None,
            category_slug=product.category.slug if product.category else None,
            subcategory_name=product.subcategory.name if product.subcategory else None,
            subcategory_slug=product.subcategory.slug if product.subcategory else None,
            price=visible_price,
            images=[
                ProductImageDTO(
                    id=img.id,
                    product_id=img.product_id,
                    url=img.url,
                    alt_text=img.alt_text,
                    is_primary=img.is_primary,
                    display_order=img.display_order,
                    created_at=img.created_at,
                )
                for img in product.images
            ],
            variants=[
                ProductVariantDTO(
                    id=v.id,
                    product_id=v.product_id,
                    size_id=v.size_id,
                    color_id=v.color_id,
                    sku=v.sku,
                    is_available=v.is_available,
                    created_at=v.created_at,
                    updated_at=v.updated_at,
                    size=SizeOptionDTO(
                        id=v.size.id, name=v.size.name, display_order=v.size.display_order
                    )
                    if v.size
                    else None,
                    color=ColorOptionDTO(
                        id=v.color.id,
                        name=v.color.name,
                        hex_code=v.color.hex_code,
                        display_order=v.color.display_order,
                    )
                    if v.color
                    else None,
                )
                for v in product.variants
            ],
        )

    def map_to_admin_response(self, product: Product) -> AdminProductResponse:
        return AdminProductResponse(
            id=product.id,
            category_id=product.category_id,
            subcategory_id=product.subcategory_id,
            name=product.name,
            slug=product.slug,
            description=product.description,
            material=product.material,
            style_code=product.style_code,
            qr_code=product.qr_code,
            qr_status=product.qr_status,
            operational_status=product.operational_status,
            is_damaged=product.is_damaged,
            is_retired=product.is_retired,
            sold_out_at=product.sold_out_at,
            damaged_at=product.damaged_at,
            retired_at=product.retired_at,
            lifecycle_state=product.lifecycle_state,
            manual_sold_out=product.manual_sold_out,
            featured=product.featured,
            price=product.price,
            show_price=product.show_price,
            meta_title=product.meta_title,
            meta_description=product.meta_description,
            created_at=product.created_at,
            updated_at=product.updated_at,
            is_available=self.calculate_availability(product),
            subcategory=SubcategorySummaryDTO(
                id=product.subcategory.id,
                category_id=product.subcategory.category_id,
                name=product.subcategory.name,
                slug=product.subcategory.slug,
                display_order=product.subcategory.display_order,
                is_active=product.subcategory.is_active,
            )
            if product.subcategory
            else None,
            images=[
                ProductImageDTO(
                    id=img.id,
                    product_id=img.product_id,
                    url=img.url,
                    alt_text=img.alt_text,
                    is_primary=img.is_primary,
                    display_order=img.display_order,
                    created_at=img.created_at,
                )
                for img in product.images
            ],
            variants=[
                ProductVariantDTO(
                    id=v.id,
                    product_id=v.product_id,
                    size_id=v.size_id,
                    color_id=v.color_id,
                    sku=v.sku,
                    is_available=v.is_available,
                    created_at=v.created_at,
                    updated_at=v.updated_at,
                    size=SizeOptionDTO(
                        id=v.size.id, name=v.size.name, display_order=v.size.display_order
                    )
                    if v.size
                    else None,
                    color=ColorOptionDTO(
                        id=v.color.id,
                        name=v.color.name,
                        hex_code=v.color.hex_code,
                        display_order=v.color.display_order,
                    )
                    if v.color
                    else None,
                )
                for v in product.variants
            ],
        )

    def map_to_qr_scan_response(self, product: Product) -> QRScanResponse:
        return self.qr_service.map_to_qr_scan_response(product)

    # --- Public APIs ---
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
            self.map_to_public_summary(
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
        return self.map_to_public_detail(
            product,
            global_show_prices=global_show_prices,
            global_show_style_codes=global_show_style_codes,
        )

    # --- Admin APIs ---
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
        mapped = [self.map_to_admin_response(p) for p in items]
        return PaginatedResponse.create(mapped, total, page, page_size)

    async def get_admin_product_by_id(self, product_id: uuid.UUID) -> AdminProductResponse:
        self.session.expire_all()
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        return self.map_to_admin_response(product)

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
        return self.map_to_admin_response(product)

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
        # Style Code is stable and immutable after creation
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

    # --- QR Scanner & Lifecycle Operations ---
    async def lookup_by_qr(self, qr_code: str) -> QRScanResponse:
        return await self.qr_service.lookup_by_qr(qr_code)

    async def execute_qr_action(self, data: QRActionRequest) -> QRScanResponse:
        return await self.qr_service.execute_qr_action(data)

    # --- QR Print Data ---
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

    # --- Two-Year Retention Automated Cleanup ---
    async def cleanup_expired_products(self, retention_years: int = 2) -> QRCleanupResponse:
        return await self.qr_service.cleanup_expired_products(retention_years)

    async def delete_product(self, product_id: uuid.UUID) -> None:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        await self.repo.delete(product)
        await self.session.commit()

    # --- Image Management ---
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

    # --- Variant Management ---
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
