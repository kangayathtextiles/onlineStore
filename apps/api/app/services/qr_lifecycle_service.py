import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundException, ValidationException
from app.models.enums import LifecycleEventType, LifecycleState
from app.models.lifecycle_log import ProductLifecycleLog
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.attribute import ColorOptionDTO, SizeOptionDTO
from app.schemas.product import (
    ProductVariantDTO,
    QRActionRequest,
    QRCleanupResponse,
    QRPrintItemDTO,
    QRScanResponse,
)


class QRLifecycleService:
    """
    Service managing physical garment lifecycle events, QR code lookups,
    scanner state changes, tag printing data, and automated retention cleanups.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = ProductRepository(session)

    @staticmethod
    def calculate_availability(product: Product) -> bool:
        if product.manual_sold_out or product.is_damaged or product.is_retired:
            return False
        if not product.variants:
            return True
        return any(v.is_available for v in product.variants)

    def map_to_qr_scan_response(self, product: Product) -> QRScanResponse:
        primary_img = next((img.url for img in product.images if img.is_primary), None)
        if not primary_img and product.images:
            primary_img = product.images[0].url

        return QRScanResponse(
            product_id=product.id,
            name=product.name,
            slug=product.slug,
            style_code=product.style_code,
            qr_code=product.qr_code or "",
            qr_status=product.qr_status,
            operational_status=product.operational_status,
            is_damaged=product.is_damaged,
            is_retired=product.is_retired,
            manual_sold_out=product.manual_sold_out,
            is_available=self.calculate_availability(product),
            price=product.price,
            show_price=product.show_price,
            category_id=product.category_id,
            category_name=product.category.name if product.category else None,
            subcategory_id=product.subcategory_id,
            subcategory_name=product.subcategory.name if product.subcategory else None,
            primary_image_url=primary_img,
            sold_out_at=product.sold_out_at,
            damaged_at=product.damaged_at,
            retired_at=product.retired_at,
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

    async def lookup_by_qr(self, qr_code: str) -> QRScanResponse:
        clean_code = qr_code.strip().upper()
        product = await self.repo.get_by_qr_code(clean_code)
        if not product:
            product = await self.repo.get_by_style_code(clean_code)
        if not product:
            raise EntityNotFoundException("QR Code / Physical Item", qr_code)
        return self.map_to_qr_scan_response(product)

    async def execute_qr_action(self, data: QRActionRequest) -> QRScanResponse:
        clean_code = data.qr_code.strip().upper()
        product = await self.repo.get_by_qr_code(clean_code)
        if not product:
            product = await self.repo.get_by_style_code(clean_code)
        if not product:
            raise EntityNotFoundException("QR Code / Physical Item", data.qr_code)

        old_status = product.operational_status
        action = data.action.upper()

        if action == "SOLD_OUT":
            product.operational_status = "SOLD_OUT"
            product.manual_sold_out = True
            product.sold_out_at = datetime.now(UTC)
            self.session.add(
                ProductLifecycleLog(
                    product_id=product.id,
                    event_type=LifecycleEventType.SOLD_OUT,
                    from_status=old_status,
                    to_status="SOLD_OUT",
                    qr_code=product.qr_code,
                    style_code=product.style_code,
                    notes=data.notes or "Marked SOLD OUT via QR Scanner.",
                )
            )
        elif action == "DAMAGED":
            product.operational_status = "DAMAGED"
            product.is_damaged = True
            product.damaged_at = datetime.now(UTC)
            self.session.add(
                ProductLifecycleLog(
                    product_id=product.id,
                    event_type=LifecycleEventType.DAMAGED,
                    from_status=old_status,
                    to_status="DAMAGED",
                    qr_code=product.qr_code,
                    style_code=product.style_code,
                    notes=data.notes or "Marked DAMAGED via QR Scanner.",
                )
            )
        elif action == "RETURN":
            product.operational_status = "AVAILABLE"
            product.manual_sold_out = False
            product.is_damaged = False
            product.sold_out_at = None
            product.damaged_at = None
            self.session.add(
                ProductLifecycleLog(
                    product_id=product.id,
                    event_type=LifecycleEventType.RETURNED,
                    from_status=old_status,
                    to_status="AVAILABLE",
                    qr_code=product.qr_code,
                    style_code=product.style_code,
                    notes=data.notes or "Product RETURN processed via QR Scanner.",
                )
            )
        else:
            raise ValidationException(
                f"Unsupported action: {data.action}. Allowed: SOLD_OUT, DAMAGED, RETURN."
            )

        await self.session.commit()
        await self.session.refresh(product)
        return self.map_to_qr_scan_response(product)

    async def get_qr_print_data(
        self,
        category_id: uuid.UUID | None = None,
        subcategory_id: uuid.UUID | None = None,
        operational_status: str | None = None,
        search: str | None = None,
    ) -> list[QRPrintItemDTO]:
        items, _ = await self.repo.list_admin_products(
            category_id=category_id,
            subcategory_id=subcategory_id,
            operational_status=operational_status,
            search=search,
            page=1,
            page_size=1000,
        )
        print_items: list[QRPrintItemDTO] = []
        for p in items:
            primary_img = next((img.url for img in p.images if img.is_primary), None)
            if not primary_img and p.images:
                primary_img = p.images[0].url
            print_items.append(
                QRPrintItemDTO(
                    product_id=p.id,
                    name=p.name,
                    slug=p.slug,
                    style_code=p.style_code or "N/A",
                    qr_code=p.qr_code or "N/A",
                    category_name=p.category.name if p.category else None,
                    subcategory_name=p.subcategory.name if p.subcategory else None,
                    price=p.price,
                    operational_status=p.operational_status,
                    primary_image_url=primary_img,
                )
            )
        return print_items

    async def cleanup_expired_products(self, retention_years: int = 2) -> QRCleanupResponse:
        cutoff = datetime.now(UTC) - timedelta(days=retention_years * 365)
        expired_products = await self.repo.find_expired_retention_products(cutoff)

        retired_count = 0
        for p in expired_products:
            old_status = p.operational_status
            p.is_retired = True
            p.operational_status = "RETIRED"
            p.lifecycle_state = LifecycleState.ARCHIVED
            p.retired_at = datetime.now(UTC)
            p.qr_status = "RELEASED"
            self.session.add(
                ProductLifecycleLog(
                    product_id=p.id,
                    event_type=LifecycleEventType.RETIRED,
                    from_status=old_status,
                    to_status="RETIRED",
                    qr_code=p.qr_code,
                    style_code=p.style_code,
                    notes=f"Auto-retention cleanup: inactive for >= {retention_years} years.",
                )
            )
            retired_count += 1

        await self.session.commit()
        return QRCleanupResponse(
            retired_count=retired_count,
            released_qr_count=retired_count,
            cutoff_date=cutoff,
            message=f"Cleaned up {retired_count} expired physical items. QR codes released for reuse.",
        )
