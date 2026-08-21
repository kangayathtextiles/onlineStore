from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data
from app.models.enums import LifecycleState
from app.schemas.product import ProductCreateRequest
from app.services.product_service import ProductService
from app.services.taxonomy_service import TaxonomyService

FORBIDDEN_PRICE_KEYS = {
    "price",
    "mrp",
    "cost",
    "unit_price",
    "sale_price",
    "discount_price",
    "amount",
}


def assert_no_price_in_payload(data: Any, path: str = "$") -> None:
    """
    Recursively inspects any JSON object/array to verify that zero price-related
    keys or pricing metadata exist anywhere in the payload.
    """
    if isinstance(data, dict):
        for key, value in data.items():
            current_path = f"{path}.{key}"
            assert key.lower() not in FORBIDDEN_PRICE_KEYS, (
                f"Price protection violation: Found forbidden key '{key}' at '{current_path}'"
            )
            assert_no_price_in_payload(value, current_path)
    elif isinstance(data, list):
        for idx, item in enumerate(data):
            assert_no_price_in_payload(item, f"{path}[{idx}]")


@pytest.mark.asyncio
async def test_regression_public_endpoints_zero_price_leakage(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """
    Mandatory Regression Test: Verify that every customer-facing public endpoint
    strictly omits any pricing information.
    """
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    tax_service = TaxonomyService(db_session)
    prod_service = ProductService(db_session)

    categories = await tax_service.list_admin_categories()
    women_cat = next(c for c in categories if c.slug == "women")
    sub_saree = women_cat.subcategories[0]

    # Create published sample product
    product = await prod_service.create_product(
        ProductCreateRequest(
            category_id=women_cat.id,
            subcategory_id=sub_saree.id,
            name="Zari Border Wedding Saree",
            material="Kanchipuram Silk",
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )

    # 1. Test /api/v1/public/products
    resp_products = await client.get("/api/v1/public/products")
    assert resp_products.status_code == 200
    assert_no_price_in_payload(resp_products.json(), path="GET /public/products")

    # 2. Test /api/v1/public/products/{slug}
    resp_detail = await client.get(f"/api/v1/public/products/{product.slug}")
    assert resp_detail.status_code == 200
    assert_no_price_in_payload(resp_detail.json(), path=f"GET /public/products/{product.slug}")

    # 3. Test /api/v1/public/sections
    resp_sections = await client.get("/api/v1/public/sections")
    assert resp_sections.status_code == 200
    assert_no_price_in_payload(resp_sections.json(), path="GET /public/sections")

    # 4. Test /api/v1/public/sections/{slug}
    resp_sec_detail = await client.get("/api/v1/public/sections/onam-special-offers")
    assert resp_sec_detail.status_code == 200
    assert_no_price_in_payload(resp_sec_detail.json(), path="GET /public/sections/{slug}")

    # 5. Test /api/v1/public/categories
    resp_cats = await client.get("/api/v1/public/categories")
    assert resp_cats.status_code == 200
    assert_no_price_in_payload(resp_cats.json(), path="GET /public/categories")

    # 6. Test /api/v1/public/saved-items/sync
    resp_sync = await client.post(
        "/api/v1/public/saved-items/sync",
        json={"session_token": "test_token_regression", "product_ids": [str(product.id)]},
    )
    assert resp_sync.status_code == 200
    assert_no_price_in_payload(resp_sync.json(), path="POST /public/saved-items/sync")

    # 7. Test /api/v1/public/saved-items/availability
    resp_avail = await client.post(
        "/api/v1/public/saved-items/availability",
        json={"product_ids": [str(product.id)]},
    )
    assert resp_avail.status_code == 200
    assert_no_price_in_payload(resp_avail.json(), path="POST /public/saved-items/availability")
