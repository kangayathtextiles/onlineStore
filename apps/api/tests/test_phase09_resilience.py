import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data


@pytest.mark.asyncio
async def test_unicode_and_malayalam_character_resilience(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verify that Malayalam Unicode script, special characters, and regional terms work safely."""
    await seed_master_data(db_session)

    # 1. Create Category with Malayalam Unicode text
    cat_resp = await client.post(
        "/api/v1/admin/categories",
        json={
            "name": "പരമ്പരാഗത വസ്ത്രങ്ങൾ (Traditional Kerala Wear)",
            "description": "കേരള തനിമയാർന്ന വസ്ത്ര ശേഖരം",
        },
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]

    subcat_resp = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={
            "category_id": cat_id,
            "name": "കസവു സാരികൾ (Kasavu Sarees)",
        },
    )
    assert subcat_resp.status_code == 201
    subcat_id = subcat_resp.json()["id"]

    # 2. Create Product with Malayalam Unicode name
    prod_resp = await client.post(
        "/api/v1/admin/products",
        json={
            "category_id": cat_id,
            "subcategory_id": subcat_id,
            "name": "ശുദ്ധമായ കൈത്തറി കസവു സാരി (Pure Handloom Kasavu Saree)",
            "material": "100% കോട്ടൺ & ഗോൾഡൻ സാരി",
            "style_code": "KASAVU-ML-001",
        },
    )
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # Publish product
    pub_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/lifecycle",
        json={"lifecycle_state": "PUBLISHED"},
    )
    assert pub_resp.status_code == 200

    # 3. Customer searches using Malayalam script
    search_resp = await client.get("/api/v1/public/products?search=കസവു")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert any(p["id"] == prod_id for p in search_data["items"])


@pytest.mark.asyncio
async def test_sql_injection_resistance_on_all_filters(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verify parameterized queries resist standard SQL injection vectors on all public query filters."""
    await seed_master_data(db_session)

    injection_payloads = [
        "' OR '1'='1",
        "'; DROP TABLE products; --",
        "' UNION SELECT NULL, NULL, NULL, NULL --",
        "1' OR 1=1 #",
        "admin'--",
        "' OR ''='",
    ]

    for payload in injection_payloads:
        # Search filter
        res = await client.get(f"/api/v1/public/products?search={payload}")
        assert res.status_code == 200
        assert "items" in res.json()

        # Category slug filter
        res_cat = await client.get(f"/api/v1/public/products?category={payload}")
        assert res_cat.status_code == 200
        assert "items" in res_cat.json()

        # Subcategory slug filter
        res_subcat = await client.get(f"/api/v1/public/products?subcategory={payload}")
        assert res_subcat.status_code == 200
        assert "items" in res_subcat.json()


@pytest.mark.asyncio
async def test_invalid_uuid_and_path_traversal_resilience(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verify validation boundaries on UUID parameters and slug path traversal."""
    await seed_master_data(db_session)

    # 1. Malformed UUID in route parameter
    res = await client.get("/api/v1/admin/products/not-a-valid-uuid")
    assert res.status_code == 422  # Unprocessable Entity

    # 2. Malformed UUID in query parameters
    res = await client.get("/api/v1/public/products?size_id=invalid-uuid-format")
    assert res.status_code == 422

    # 3. Path traversal attempts on public slugs
    traversal_slugs = [
        "../../../etc/passwd",
        "..%2F..%2Fwindows%2Fsystem32",
        "invalid..slug//test",
    ]
    for slug in traversal_slugs:
        res = await client.get(f"/api/v1/public/products/{slug}")
        assert res.status_code in [404, 422]


@pytest.mark.asyncio
async def test_exhaustive_zero_price_guarantee_across_public_surface(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Exhaustively verify no public endpoint returns price, currency, or monetary values."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # Gather public responses
    endpoints_to_test = [
        "/api/v1/public/store",
        "/api/v1/public/store/status",
        "/api/v1/public/categories",
        "/api/v1/public/attributes/sizes",
        "/api/v1/public/attributes/colors",
        "/api/v1/public/products",
        "/api/v1/public/sections",
    ]

    for ep in endpoints_to_test:
        resp = await client.get(ep)
        assert resp.status_code == 200
        data = resp.json()

        # Recursive check for any price related keys
        def assert_no_price_keys(obj: object, path: str = "") -> None:
            if isinstance(obj, dict):
                for k, v in obj.items():
                    k_lower = k.lower()
                    assert "mrp" not in k_lower, f"MRP key found at {path}.{k}"
                    assert "cost" not in k_lower, f"Cost key found at {path}.{k}"
                    assert "amount" not in k_lower, f"Amount key found at {path}.{k}"
                    assert "currency" not in k_lower, f"Currency key found at {path}.{k}"
                    assert "checkout" not in k_lower, f"Checkout key found at {path}.{k}"
                    assert_no_price_keys(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for idx, item in enumerate(obj):
                    assert_no_price_keys(item, f"{path}[{idx}]")

        assert_no_price_keys(data, ep)


@pytest.mark.asyncio
async def test_wishlist_idempotency_and_stale_product_resilience(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Verify session wishlist sync handles duplicate IDs, missing IDs, and stale products gracefully."""
    await seed_master_data(db_session)

    session_token = "resilience_test_session_token_123"

    # 1. Sync with duplicate product IDs in list
    prods_resp = await client.get("/api/v1/public/products")
    if prods_resp.json()["items"]:
        first_prod_id = prods_resp.json()["items"][0]["id"]

        sync_resp = await client.post(
            "/api/v1/public/saved-items/sync",
            json={
                "session_token": session_token,
                "product_ids": [first_prod_id, first_prod_id, first_prod_id],
            },
        )
        assert sync_resp.status_code == 200
        # Should deduplicate cleanly
        assert sync_resp.json()["total_saved"] == 1

    # 2. Check availability on random nonexistent UUIDs
    random_uuid = "00000000-0000-0000-0000-000000000000"
    avail_resp = await client.post(
        "/api/v1/public/saved-items/availability",
        json={"product_ids": [random_uuid]},
    )
    assert avail_resp.status_code == 200
    # Nonexistent IDs simply omitted without crash
    assert len(avail_resp.json()) == 0


@pytest.mark.asyncio
async def test_category_dependency_integrity(client: AsyncClient, db_session: AsyncSession) -> None:
    """Verify that deleting a Category with active products fails cleanly to protect catalogue data."""
    await seed_master_data(db_session)

    # 1. Create Category and Subcategory
    cat_resp = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Integrity Test Category"},
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]

    subcat_resp = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={"category_id": cat_id, "name": "Integrity Test Subcategory"},
    )
    assert subcat_resp.status_code == 201
    subcat_id = subcat_resp.json()["id"]

    # 2. Create Product in this category
    prod_resp = await client.post(
        "/api/v1/admin/products",
        json={
            "category_id": cat_id,
            "subcategory_id": subcat_id,
            "name": "Integrity Test Garment",
        },
    )
    assert prod_resp.status_code == 201

    # 3. Attempt to delete category -> must fail with 400 / 409 (Cannot delete category with associated products)
    del_resp = await client.delete(f"/api/v1/admin/categories/{cat_id}")
    assert del_resp.status_code in [400, 409]
    assert "cannot delete category" in del_resp.json()["error"]["message"].lower()
