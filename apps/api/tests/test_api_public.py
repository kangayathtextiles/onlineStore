import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data
from app.models.enums import LifecycleState
from app.schemas.product import ProductCreateRequest
from app.services.product_service import ProductService
from app.services.taxonomy_service import TaxonomyService


@pytest.mark.asyncio
async def test_public_store_endpoints(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test GET /api/v1/public/store and /api/v1/public/store/status."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # 1. Store profile
    resp = await client.get("/api/v1/public/store")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Kangayath Clothing & Textiles"
    assert data["state"] == "Kerala"
    assert "schedules" in data
    assert len(data["schedules"]) == 7

    # 2. Store status
    status_resp = await client.get("/api/v1/public/store/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert "is_open" in status_data
    assert "current_time_ist" in status_data


@pytest.mark.asyncio
async def test_public_categories_and_attributes(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Test public category tree and size/color filter lists."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # Categories
    cat_resp = await client.get("/api/v1/public/categories")
    assert cat_resp.status_code == 200
    cats = cat_resp.json()
    assert len(cats) >= 3
    assert any(c["slug"] == "men" for c in cats)

    # Sizes
    sizes_resp = await client.get("/api/v1/public/attributes/sizes")
    assert sizes_resp.status_code == 200
    sizes = sizes_resp.json()
    assert len(sizes) >= 16

    # Colors
    colors_resp = await client.get("/api/v1/public/attributes/colors")
    assert colors_resp.status_code == 200
    colors = colors_resp.json()
    assert len(colors) >= 10


@pytest.mark.asyncio
async def test_public_products_discovery_and_filtering(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Test public product listing, category filtering, search, and detail lookup."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    tax_service = TaxonomyService(db_session)
    prod_service = ProductService(db_session)

    categories = await tax_service.list_admin_categories()
    women_cat = next(c for c in categories if c.slug == "women")
    sub_saree = women_cat.subcategories[0]

    # Create published product
    p1 = await prod_service.create_product(
        ProductCreateRequest(
            category_id=women_cat.id,
            subcategory_id=sub_saree.id,
            name="Traditional Kanchipuram Silk Saree",
            material="Pure Mulberry Silk",
            style_code="KANCHI-001",
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )

    # Create draft product (should be hidden from public)
    await prod_service.create_product(
        ProductCreateRequest(
            category_id=women_cat.id,
            subcategory_id=sub_saree.id,
            name="Draft Silk Saree Unreleased",
            lifecycle_state=LifecycleState.DRAFT,
        )
    )

    # 1. Discover all public products
    resp = await client.get("/api/v1/public/products")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Traditional Kanchipuram Silk Saree"
    assert body["items"][0]["price"] is None

    # 2. Filter by Category
    cat_filter_resp = await client.get("/api/v1/public/products?category=women")
    assert cat_filter_resp.status_code == 200
    assert cat_filter_resp.json()["total"] == 1

    # 3. Filter by Non-existent Category
    empty_resp = await client.get("/api/v1/public/products?category=non-existent")
    assert empty_resp.status_code == 200
    assert empty_resp.json()["total"] == 0

    # 4. Search query
    search_resp = await client.get("/api/v1/public/products?search=Mulberry")
    assert search_resp.status_code == 200
    assert search_resp.json()["total"] == 1

    # 5. Detail page lookup by slug
    detail_resp = await client.get(f"/api/v1/public/products/{p1.slug}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["name"] == "Traditional Kanchipuram Silk Saree"
    assert detail["material"] == "Pure Mulberry Silk"
    assert detail["price"] is None


@pytest.mark.asyncio
async def test_public_sections_and_saved_items(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Test public custom sections and anonymous saved items synchronization."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # 1. Custom Sections
    sec_resp = await client.get("/api/v1/public/sections")
    assert sec_resp.status_code == 200
    sections = sec_resp.json()
    assert len(sections) >= 1
    assert sections[0]["slug"] == "onam-special-offers"

    # 2. Saved Items Sync
    sync_resp = await client.post(
        "/api/v1/public/saved-items/sync",
        json={
            "session_token": "session_anon_token_12345",
            "product_ids": [],
        },
    )
    assert sync_resp.status_code == 200
    assert sync_resp.json()["total_saved"] == 0
