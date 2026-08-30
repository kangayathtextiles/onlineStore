from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data
from app.models.enums import LifecycleState
from app.models.product import Product
from app.models.taxonomy import Category, Subcategory
from app.schemas.product import ProductCreateRequest
from app.schemas.store import StoreProfileUpdate
from app.services.product_service import ProductService
from app.services.qr_service import generate_qr_code, generate_style_code
from app.services.store_service import StoreService


@pytest.mark.asyncio
async def test_qr_and_style_code_generation_format() -> None:
    """Verify deterministic format and entropy of style code and QR code generators."""
    style_code = generate_style_code("womens-wear", "sarees")
    assert style_code.startswith("KGY-")
    parts = style_code.split("-")
    assert len(parts) == 5
    assert parts[0] == "KGY"
    assert len(parts[1]) == 3
    assert len(parts[2]) == 3
    assert len(parts[3]) == 6  # YYMMDD date component
    assert len(parts[4]) == 4  # 4-char hex entropy

    qr_code = generate_qr_code()
    assert qr_code.startswith("KGY-QR-")
    qr_parts = qr_code.split("-")
    assert len(qr_parts) == 3
    assert len(qr_parts[2]) == 8


@pytest.mark.asyncio
async def test_product_creation_auto_generates_qr_and_style_code(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Creating a product automatically assigns unique style code, QR code, and lifecycle log."""
    await seed_master_data(db_session)
    prod_service = ProductService(db_session)

    # Setup taxonomy
    cat = Category(name="Silk Sarees", slug="silk-sarees", is_active=True)
    sub = Subcategory(
        category=cat, name="Kanchipuram Silk", slug="kanchipuram-silk", is_active=True
    )
    db_session.add_all([cat, sub])
    await db_session.flush()

    # Create Product via service
    product = await prod_service.create_product(
        ProductCreateRequest(
            category_id=cat.id,
            subcategory_id=sub.id,
            name="Traditional Gold Zari Saree",
            material="Pure Mulberry Silk",
            price=Decimal("8500.00"),
            show_price=True,
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )

    assert product.style_code is not None
    assert product.style_code.startswith("KGY-")
    assert product.qr_code is not None
    assert product.qr_code.startswith("KGY-QR-")
    assert product.operational_status == "AVAILABLE"
    assert product.qr_status == "ACTIVE"
    assert product.is_damaged is False
    assert product.is_retired is False


@pytest.mark.asyncio
async def test_qr_scanner_lookup_and_actions(client: AsyncClient, db_session: AsyncSession) -> None:
    """Verify QR lookup and the three authoritative lifecycle actions: SOLD_OUT, DAMAGED, RETURN."""
    await seed_master_data(db_session)
    # Setup taxonomy and product
    cat = Category(name="Mens Wear", slug="mens-wear", is_active=True)
    sub = Subcategory(category=cat, name="Dhotis", slug="dhotis", is_active=True)
    db_session.add_all([cat, sub])
    await db_session.flush()

    prod = Product(
        category_id=cat.id,
        subcategory_id=sub.id,
        name="Kasavu Pure Cotton Dhoti",
        slug="kasavu-pure-cotton-dhoti",
        style_code="KGY-MEN-DHO-260830-1A2B",
        qr_code="KGY-QR-A1B2C3D4",
        qr_status="ACTIVE",
        operational_status="AVAILABLE",
        is_damaged=False,
        is_retired=False,
        lifecycle_state=LifecycleState.PUBLISHED,
        manual_sold_out=False,
        price=Decimal("1250.00"),
        show_price=True,
    )
    db_session.add(prod)
    await db_session.commit()

    # 1. Lookup by QR Code
    lookup_resp = await client.get("/api/v1/admin/qr/lookup?code=KGY-QR-A1B2C3D4")
    assert lookup_resp.status_code == 200
    scan_data = lookup_resp.json()
    assert scan_data["name"] == "Kasavu Pure Cotton Dhoti"
    assert scan_data["operational_status"] == "AVAILABLE"

    # 2. Action: SOLD_OUT
    action_resp1 = await client.post(
        "/api/v1/admin/qr/action",
        json={"qr_code": "KGY-QR-A1B2C3D4", "action": "SOLD_OUT", "notes": "Sold at counter 1"},
    )
    assert action_resp1.status_code == 200
    assert action_resp1.json()["operational_status"] == "SOLD_OUT"
    assert action_resp1.json()["manual_sold_out"] is True
    assert action_resp1.json()["sold_out_at"] is not None

    # 3. Action: DAMAGED
    action_resp2 = await client.post(
        "/api/v1/admin/qr/action",
        json={
            "qr_code": "KGY-QR-A1B2C3D4",
            "action": "DAMAGED",
            "notes": "Torn fabric during trial",
        },
    )
    assert action_resp2.status_code == 200
    assert action_resp2.json()["operational_status"] == "DAMAGED"
    assert action_resp2.json()["is_damaged"] is True
    assert action_resp2.json()["damaged_at"] is not None

    # Verify damaged item is excluded from public discovery
    public_list = await client.get("/api/v1/public/products")
    assert public_list.status_code == 200
    assert not any(p["id"] == str(prod.id) for p in public_list.json()["items"])

    # 4. Action: RETURN
    action_resp3 = await client.post(
        "/api/v1/admin/qr/action",
        json={
            "qr_code": "KGY-QR-A1B2C3D4",
            "action": "RETURN",
            "notes": "Customer returned unopened piece",
        },
    )
    assert action_resp3.status_code == 200
    assert action_resp3.json()["operational_status"] == "AVAILABLE"
    assert action_resp3.json()["is_damaged"] is False
    assert action_resp3.json()["manual_sold_out"] is False
    assert action_resp3.json()["sold_out_at"] is None
    assert action_resp3.json()["damaged_at"] is None

    # Restored piece is once again visible on customer catalog
    public_list2 = await client.get("/api/v1/public/products")
    assert any(p["id"] == str(prod.id) for p in public_list2.json()["items"])


@pytest.mark.asyncio
async def test_style_code_customer_visibility_toggle(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verify Master Style Code visibility toggle in Shop Status & Info."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)
    store_service = StoreService(db_session)

    # Create product with style code
    cat = Category(name="Kids Wear", slug="kids-wear", is_active=True)
    sub = Subcategory(category=cat, name="Pattu Pavada", slug="pattu-pavada", is_active=True)
    db_session.add_all([cat, sub])
    await db_session.flush()

    prod = Product(
        category_id=cat.id,
        subcategory_id=sub.id,
        name="Girls Pattu Pavada Set",
        slug="girls-pattu-pavada-set",
        style_code="KGY-KID-PAT-260830-9Z8Y",
        qr_code="KGY-QR-9Z8Y7X6W",
        qr_status="ACTIVE",
        operational_status="AVAILABLE",
        is_damaged=False,
        is_retired=False,
        lifecycle_state=LifecycleState.PUBLISHED,
        manual_sold_out=False,
        price=Decimal("2400.00"),
        show_price=True,
    )
    db_session.add(prod)
    await db_session.commit()

    # Step 1: Default show_style_codes is True -> public returns style_code
    pub1 = await client.get(f"/api/v1/public/products/{prod.slug}")
    assert pub1.status_code == 200
    assert pub1.json()["style_code"] == "KGY-KID-PAT-260830-9Z8Y"

    # Step 2: Toggle show_style_codes = False in StoreProfile
    await store_service.update_store_profile(StoreProfileUpdate(show_style_codes=False))

    # Step 3: Public catalog and detail now suppress style_code (returns null)
    pub2 = await client.get(f"/api/v1/public/products/{prod.slug}")
    assert pub2.status_code == 200
    assert pub2.json()["style_code"] is None

    pub_list = await client.get("/api/v1/public/products")
    item = next(p for p in pub_list.json()["items"] if p["slug"] == prod.slug)
    assert item["style_code"] is None

    # Step 4: Admin endpoints ALWAYS retain and show style_code
    admin_prod = await client.get(f"/api/v1/admin/products/{prod.id}")
    assert admin_prod.status_code == 200
    assert admin_prod.json()["style_code"] == "KGY-KID-PAT-260830-9Z8Y"

    qr_lookup = await client.get("/api/v1/admin/qr/lookup?code=KGY-QR-9Z8Y7X6W")
    assert qr_lookup.status_code == 200
    assert qr_lookup.json()["style_code"] == "KGY-KID-PAT-260830-9Z8Y"


@pytest.mark.asyncio
async def test_two_year_retention_cleanup(client: AsyncClient, db_session: AsyncSession) -> None:
    """Verify automated 2-year retention cleanup for sold out and damaged garments."""
    cat = Category(name="Fabrics", slug="fabrics", is_active=True)
    sub = Subcategory(category=cat, name="Linen", slug="linen", is_active=True)
    db_session.add_all([cat, sub])
    await db_session.flush()

    old_date = datetime.now(UTC) - timedelta(days=365 * 3)  # 3 years ago

    # 1. Product sold out 3 years ago
    old_sold = Product(
        category_id=cat.id,
        subcategory_id=sub.id,
        name="Ancient Linen Fabric",
        slug="ancient-linen-fabric",
        style_code="KGY-FAB-LIN-230101-0001",
        qr_code="KGY-QR-OLD00001",
        qr_status="ACTIVE",
        operational_status="SOLD_OUT",
        manual_sold_out=True,
        sold_out_at=old_date,
        is_damaged=False,
        is_retired=False,
        lifecycle_state=LifecycleState.PUBLISHED,
    )

    # 2. Product recently sold out (10 days ago)
    recent_sold = Product(
        category_id=cat.id,
        subcategory_id=sub.id,
        name="Recent Linen Fabric",
        slug="recent-linen-fabric",
        style_code="KGY-FAB-LIN-260820-0002",
        qr_code="KGY-QR-NEW00002",
        qr_status="ACTIVE",
        operational_status="SOLD_OUT",
        manual_sold_out=True,
        sold_out_at=datetime.now(UTC) - timedelta(days=10),
        is_damaged=False,
        is_retired=False,
        lifecycle_state=LifecycleState.PUBLISHED,
    )

    db_session.add_all([old_sold, recent_sold])
    await db_session.commit()

    # Trigger cleanup for 2 years threshold
    cleanup_resp = await client.post("/api/v1/admin/qr/cleanup?retention_years=2")
    assert cleanup_resp.status_code == 200
    res_data = cleanup_resp.json()
    assert res_data["retired_count"] >= 1

    # Verify old product was retired and QR released
    await db_session.refresh(old_sold)
    assert old_sold.is_retired is True
    assert old_sold.operational_status == "RETIRED"
    assert old_sold.qr_status == "RELEASED"

    # Verify recent product remains active
    await db_session.refresh(recent_sold)
    assert recent_sold.is_retired is False
    assert recent_sold.operational_status == "SOLD_OUT"
    assert recent_sold.qr_status == "ACTIVE"
