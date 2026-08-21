import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data


@pytest.mark.asyncio
async def test_health_and_openapi_integrity(client: AsyncClient, db_session: AsyncSession) -> None:
    """Verify application health probe and OpenAPI specification schema."""
    # 1. Health Probe
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

    # 2. OpenAPI JSON Specification
    openapi_resp = await client.get("/api/v1/openapi.json")
    assert openapi_resp.status_code == 200
    spec = openapi_resp.json()
    assert spec["openapi"].startswith("3.")
    assert "/api/v1/public/products" in spec["paths"]
    assert "/api/v1/admin/products" in spec["paths"]
    assert "/api/v1/public/store/status" in spec["paths"]


@pytest.mark.asyncio
async def test_admin_and_customer_data_boundary(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verify lifecycle visibility boundaries: DRAFT/HIDDEN/ARCHIVED products are never exposed to public."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # 1. Fetch categories
    tree_resp = await client.get("/api/v1/public/categories")
    assert tree_resp.status_code == 200
    cat = tree_resp.json()[0]
    cat_id = cat["id"]
    subcat_id = cat["subcategories"][0]["id"]

    # 2. Create product in DRAFT state
    create_resp = await client.post(
        "/api/v1/admin/products",
        json={
            "category_id": cat_id,
            "subcategory_id": subcat_id,
            "name": "Phase 11 Boundary Test Garment",
            "style_code": "P11-TEST-001",
            "material": "Handloom Cotton",
        },
    )
    assert create_resp.status_code == 201
    prod_id = create_resp.json()["id"]
    prod_slug = create_resp.json()["slug"]

    # 3. Verify public catalog does NOT contain this draft product
    pub_list = await client.get("/api/v1/public/products")
    assert not any(p["id"] == prod_id for p in pub_list.json()["items"])

    # 4. Verify direct slug request returns 404
    pub_detail = await client.get(f"/api/v1/public/products/{prod_slug}")
    assert pub_detail.status_code == 404

    # 5. Publish product
    await client.put(
        f"/api/v1/admin/products/{prod_id}/lifecycle",
        json={"lifecycle_state": "PUBLISHED"},
    )
    pub_detail_published = await client.get(f"/api/v1/public/products/{prod_slug}")
    assert pub_detail_published.status_code == 200
    assert pub_detail_published.json()["name"] == "Phase 11 Boundary Test Garment"

    # 6. Hide product
    await client.put(
        f"/api/v1/admin/products/{prod_id}/lifecycle",
        json={"lifecycle_state": "HIDDEN"},
    )
    pub_detail_hidden = await client.get(f"/api/v1/public/products/{prod_slug}")
    assert pub_detail_hidden.status_code == 404

    # 7. Archive product
    await client.put(
        f"/api/v1/admin/products/{prod_id}/lifecycle",
        json={"lifecycle_state": "ARCHIVED"},
    )
    pub_detail_archived = await client.get(f"/api/v1/public/products/{prod_slug}")
    assert pub_detail_archived.status_code == 404


@pytest.mark.asyncio
async def test_exhaustive_zero_price_contract_verification(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Exhaustive recursive verification that zero monetary or price keys exist on any customer endpoint."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    endpoints = [
        "/api/v1/public/store",
        "/api/v1/public/store/status",
        "/api/v1/public/categories",
        "/api/v1/public/attributes/sizes",
        "/api/v1/public/attributes/colors",
        "/api/v1/public/products",
        "/api/v1/public/sections",
    ]

    for ep in endpoints:
        resp = await client.get(ep)
        assert resp.status_code == 200
        payload = resp.json()

        def scan_no_price(obj: object, path: str = "") -> None:
            if isinstance(obj, dict):
                for k, v in obj.items():
                    k_str = k.lower()
                    assert "price" not in k_str, f"Forbidden key 'price' found at {path}.{k}"
                    assert "mrp" not in k_str, f"Forbidden key 'mrp' found at {path}.{k}"
                    assert "cost" not in k_str, f"Forbidden key 'cost' found at {path}.{k}"
                    assert "amount" not in k_str, f"Forbidden key 'amount' found at {path}.{k}"
                    assert "currency" not in k_str, f"Forbidden key 'currency' found at {path}.{k}"
                    scan_no_price(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    scan_no_price(item, f"{path}[{i}]")

        scan_no_price(payload, ep)
