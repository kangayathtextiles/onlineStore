import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_async_session
from app.schemas.product import (
    QRActionRequest,
    QRCleanupResponse,
    QRPrintItemDTO,
    QRScanResponse,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/qr", tags=["admin-qr"])


@router.get("/lookup", response_model=QRScanResponse)
async def lookup_by_qr(
    code: str = Query(..., min_length=1, description="QR code identifier or style code"),
    session: AsyncSession = Depends(get_async_session),
) -> QRScanResponse:
    """
    Look up and resolve a physical product/item by its scanned QR identity token or Style Code.
    """
    service = ProductService(session)
    return await service.lookup_by_qr(code)


@router.post("/action", response_model=QRScanResponse)
async def execute_qr_action(
    payload: QRActionRequest,
    session: AsyncSession = Depends(get_async_session),
) -> QRScanResponse:
    """
    Execute one of the three authoritative lifecycle actions on a physical product:
    - SOLD_OUT: Marks garment sold out and sets retention timer
    - DAMAGED: Marks garment damaged, immediately hides from customer site, and sets retention timer
    - RETURN: Marks garment back into active showroom inventory
    """
    service = ProductService(session)
    return await service.execute_qr_action(payload)


@router.get("/print-data", response_model=list[QRPrintItemDTO])
async def get_qr_print_data(
    category_id: uuid.UUID | None = Query(default=None),
    subcategory_id: uuid.UUID | None = Query(default=None),
    operational_status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_async_session),
) -> list[QRPrintItemDTO]:
    """
    Retrieve product items formatted for batch QR and Style Code label tag printing.
    """
    service = ProductService(session)
    return await service.get_qr_print_data(
        category_id=category_id,
        subcategory_id=subcategory_id,
        operational_status=operational_status,
        search=search,
    )


@router.post("/cleanup", response_model=QRCleanupResponse)
async def trigger_retention_cleanup(
    retention_years: int = Query(
        default=2, ge=1, description="Retention duration threshold in years"
    ),
    session: AsyncSession = Depends(get_async_session),
) -> QRCleanupResponse:
    """
    Trigger server-side two-year automatic cleanup for sold out and damaged garments,
    retiring products and releasing QR identities for controlled reuse.
    """
    service = ProductService(session)
    return await service.cleanup_expired_products(retention_years=retention_years)
