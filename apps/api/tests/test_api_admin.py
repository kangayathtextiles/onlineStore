import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data


@pytest.mark.asyncio
async def test_admin_store_management(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test admin store update and schedule override."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # 1. Update Profile
    update_resp = await client.put(
        "/api/v1/admin/store",
        json={"tagline": "Updated Boutique Slogan", "pincode": "680002"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["tagline"] == "Updated Boutique Slogan"

    # 2. Emergency Override
    override_resp = await client.post(
        "/api/v1/admin/store/override",
        json={
            "override_mode": "FORCE_CLOSED",
            "override_banner": "Closed for Renovation",
        },
    )
    assert override_resp.status_code == 200
    assert override_resp.json()["is_open"] is False
    assert override_resp.json()["effective_mode"] == "FORCE_CLOSED"


@pytest.mark.asyncio
async def test_admin_category_and_subcategory_crud(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Test category creation, subcategory creation, and deletion restriction."""
    await seed_master_data(db_session)

    # 1. Create Category
    cat_resp = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Festive Wedding", "description": "Wedding silk and sherwanis"},
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]

    # 2. Create Subcategory
    sub_resp = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={"category_id": cat_id, "name": "Bridal Lehengas"},
    )
    assert sub_resp.status_code == 201
    sub_id = sub_resp.json()["id"]

    # 3. Attempt to delete category with active subcategory -> Must raise 409 Conflict
    del_cat_resp = await client.delete(f"/api/v1/admin/categories/{cat_id}")
    assert del_cat_resp.status_code == 409
    assert del_cat_resp.json()["error"]["code"] == "CATEGORY_HAS_ACTIVE_DEPENDENCIES"

    # 4. Delete subcategory first
    del_sub_resp = await client.delete(f"/api/v1/admin/categories/subcategories/{sub_id}")
    assert del_sub_resp.status_code == 200

    # 5. Now delete category -> Should succeed
    del_cat_ok = await client.delete(f"/api/v1/admin/categories/{cat_id}")
    assert del_cat_ok.status_code == 200


@pytest.mark.asyncio
async def test_admin_product_full_lifecycle(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test complete product creation, image gallery, variant matrix, and availability toggles."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # Get Category & Subcategory
    cats_resp = await client.get("/api/v1/admin/categories")
    cat = cats_resp.json()[0]
    cat_id = cat["id"]
    sub_id = cat["subcategories"][0]["id"]

    # 1. Create Product
    prod_resp = await client.post(
        "/api/v1/admin/products",
        json={
            "category_id": cat_id,
            "subcategory_id": sub_id,
            "name": "Men Handloom Silk Kurta",
            "material": "Handloom Silk",
            "style_code": "KURTA-101",
        },
    )
    assert prod_resp.status_code == 201
    prod_data = prod_resp.json()
    prod_id = prod_data["id"]
    assert prod_data["lifecycle_state"] == "DRAFT"

    # 2. Upload Image
    img_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/images",
        json={"url": "https://images.kangayath.in/kurta-hero.webp", "is_primary": True},
    )
    assert img_resp.status_code == 201
    assert len(img_resp.json()["images"]) == 1
    assert img_resp.json()["images"][0]["is_primary"] is True

    # 3. Generate Variant Matrix
    sizes_resp = await client.get("/api/v1/admin/attributes/sizes")
    colors_resp = await client.get("/api/v1/admin/attributes/colors")
    size_ids = [s["id"] for s in sizes_resp.json()[:2]]
    color_ids = [c["id"] for c in colors_resp.json()[:2]]

    matrix_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/variants/matrix",
        json={"size_ids": size_ids, "color_ids": color_ids, "default_available": True},
    )
    assert matrix_resp.status_code == 200
    prod_with_variants = matrix_resp.json()
    assert len(prod_with_variants["variants"]) == 4

    # 4. Toggle single variant to Sold Out
    var_id = prod_with_variants["variants"][0]["id"]
    toggle_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/variants/{var_id}/availability",
        json={"is_available": False},
    )
    assert toggle_resp.status_code == 200
    updated_var = next(v for v in toggle_resp.json()["variants"] if v["id"] == var_id)
    assert updated_var["is_available"] is False

    # 5. Publish Product
    pub_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/lifecycle",
        json={"lifecycle_state": "PUBLISHED"},
    )
    assert pub_resp.status_code == 200
    assert pub_resp.json()["lifecycle_state"] == "PUBLISHED"
