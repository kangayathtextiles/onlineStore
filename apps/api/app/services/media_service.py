import logging
import uuid
from collections.abc import Awaitable, Callable

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    EntityNotFoundException,
    ImageLimitExceededException,
    ValidationException,
)
from app.core.security import validate_upload_file
from app.models.product import Product, ProductImage
from app.repositories.product_repository import ProductRepository
from app.schemas.attribute import ColorOptionDTO, SizeOptionDTO
from app.schemas.product import (
    AdminProductResponse,
    ProductImageCreate,
    ProductImageDTO,
    ProductImageReorderRequest,
    ProductVariantDTO,
)
from app.schemas.taxonomy import SubcategorySummaryDTO
from app.services import storage_service

logger = logging.getLogger(__name__)


class ProductMediaService:
    """
    Dedicated domain service managing product images:
    upload, attachment, ordering, and cloud storage deletion.
    """

    def __init__(
        self,
        session: AsyncSession,
        get_admin_product_callback: (
            Callable[[uuid.UUID], Awaitable[AdminProductResponse]] | None
        ) = None,
    ) -> None:
        self.session = session
        self.repo = ProductRepository(session)
        self._get_admin_product_callback = get_admin_product_callback

    @staticmethod
    def calculate_availability(product: Product) -> bool:
        if product.manual_sold_out or product.is_damaged or product.is_retired:
            return False
        if not product.variants:
            return True
        return any(v.is_available for v in product.variants)

    def _map_to_admin_response(self, product: Product) -> AdminProductResponse:
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

    async def _resolve_admin_response(self, product_id: uuid.UUID) -> AdminProductResponse:
        if self._get_admin_product_callback:
            return await self._get_admin_product_callback(product_id)
        self.session.expire_all()
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)
        return self._map_to_admin_response(product)

    async def add_image(
        self, product_id: uuid.UUID, data: ProductImageCreate
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        count = await self.repo.count_product_images(product_id)
        if count >= 6:
            raise ImageLimitExceededException(current_count=count, limit=6)

        # If marked primary or first image, unset primary on others
        is_primary = data.is_primary or (count == 0)
        if is_primary:
            for img in product.images:
                img.is_primary = False

        new_image = ProductImage(
            product_id=product_id,
            url=data.url,
            alt_text=data.alt_text or product.name,
            is_primary=is_primary,
            display_order=data.display_order or count,
        )
        await self.repo.create_image(new_image)
        await self.session.commit()
        return await self._resolve_admin_response(product_id)

    async def upload_image(
        self,
        product_id: uuid.UUID,
        file: UploadFile,
        is_primary: bool = False,
        alt_text: str | None = None,
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        count = await self.repo.count_product_images(product_id)
        if count >= 6:
            raise ImageLimitExceededException(current_count=count, limit=6)

        is_valid, err_msg, content, mime_type = await validate_upload_file(file)
        if not is_valid:
            raise ValidationException(err_msg)

        ext = (file.filename or "image.jpg").rsplit(".", 1)[-1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        object_path = f"products/{unique_filename}"

        image_url = await storage_service.upload_file(object_path, content, mime_type)

        image_data = ProductImageCreate(
            url=image_url,
            alt_text=alt_text or product.name,
            is_primary=is_primary,
            display_order=count,
        )
        return await self.add_image(product_id, image_data)

    async def delete_image(
        self, product_id: uuid.UUID, image_id: uuid.UUID
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        img = await self.repo.get_image_by_id(image_id)
        if not img or img.product_id != product_id:
            raise EntityNotFoundException("ProductImage", image_id)

        was_primary = img.is_primary
        deleted_url = img.url
        await self.repo.delete_image(img)

        # If deleted primary, promote first remaining image to primary
        if was_primary and product.images:
            remaining = [i for i in product.images if i.id != image_id]
            if remaining:
                remaining[0].is_primary = True

        await self.session.commit()

        # Delete from Supabase Storage (best-effort; logs warning on failure)
        if "/storage/v1/object/public/" in deleted_url:
            try:
                bucket = settings.SUPABASE_STORAGE_BUCKET
                marker = f"/object/public/{bucket}/"
                idx = deleted_url.find(marker)
                if idx != -1:
                    object_path = deleted_url[idx + len(marker) :]
                    await storage_service.delete_file(object_path)
            except Exception as del_err:
                logger.warning("Storage delete warning: %s", del_err)

        return await self._resolve_admin_response(product_id)

    async def reorder_images(
        self, product_id: uuid.UUID, req: ProductImageReorderRequest
    ) -> AdminProductResponse:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise EntityNotFoundException("Product", product_id)

        img_map = {img.id: img for img in product.images}
        has_primary = False

        for item in req.images:
            if item.image_id in img_map:
                img = img_map[item.image_id]
                img.display_order = item.display_order
                img.is_primary = item.is_primary
                if item.is_primary:
                    has_primary = True

        if not has_primary and product.images:
            product.images[0].is_primary = True

        await self.session.commit()
        return await self._resolve_admin_response(product_id)
