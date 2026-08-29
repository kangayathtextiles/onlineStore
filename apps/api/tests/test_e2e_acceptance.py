import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data


@pytest.mark.asyncio
async def test_complete_26_step_e2e_acceptance_journey(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Execute the complete 26-step end-to-end user acceptance and synchronization journey."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # 1. Admin creates a category
    cat_resp = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Celebration Handlooms", "description": "Authentic Kerala handloom wear"},
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]
    cat_slug = cat_resp.json()["slug"]

    # 2. Admin creates subcategory
    subcat_resp = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={"category_id": cat_id, "name": "Set Mundu & Dhotis"},
    )
    assert subcat_resp.status_code == 201
    subcat_id = subcat_resp.json()["id"]
    subcat_slug = subcat_resp.json()["slug"]

    # 3. Admin creates product
    prod_resp = await client.post(
        "/api/v1/admin/products",
        json={
            "category_id": cat_id,
            "subcategory_id": subcat_id,
            "name": "Balaramapuram Pure Cotton Set Mundu",
            "material": "100% Fine Handloom Cotton",
            "style_code": "BALA-SET-001",
        },
    )
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]

    # 4. Admin uploads images
    img1_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/images",
        json={
            "url": "https://images.kangayath.in/set-mundu-front.webp",
            "alt_text": "Balaramapuram Set Mundu full view",
            "is_primary": True,
        },
    )
    assert img1_resp.status_code == 201

    img2_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/images",
        json={
            "url": "https://images.kangayath.in/set-mundu-kara.webp",
            "alt_text": "Golden Kara border detail",
            "is_primary": False,
        },
    )
    assert img2_resp.status_code == 201

    # 5. Admin creates multiple size/color variations
    sizes_resp = await client.get("/api/v1/admin/attributes/sizes")
    colors_resp = await client.get("/api/v1/admin/attributes/colors")
    size_ids = [s["id"] for s in sizes_resp.json()[:2]]
    color_ids = [c["id"] for c in colors_resp.json()[:2]]

    matrix_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/variants/matrix",
        json={"size_ids": size_ids, "color_ids": color_ids, "default_available": True},
    )
    assert matrix_resp.status_code == 200
    variants = matrix_resp.json()["variants"]
    assert len(variants) == 4

    # 6. Admin sets availability independently
    var_to_disable = variants[0]["id"]
    var_to_keep = variants[1]["id"]
    toggle_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/variants/{var_to_disable}/availability",
        json={"is_available": False},
    )
    assert toggle_resp.status_code == 200

    # Publish the garment so it becomes visible to customer digital showroom
    pub_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/lifecycle",
        json={"lifecycle_state": "PUBLISHED"},
    )
    assert pub_resp.status_code == 200
    prod_slug = pub_resp.json()["slug"]

    # 7. Admin creates a custom section
    sec_resp = await client.post(
        "/api/v1/admin/sections",
        json={
            "title": "Kerala Traditional Handlooms",
            "subtitle": "Directly woven by master weavers",
            "is_active": True,
        },
    )
    assert sec_resp.status_code == 201
    sec_id = sec_resp.json()["id"]

    # 8. Admin adds product to section
    add_item_resp = await client.put(
        f"/api/v1/admin/sections/{sec_id}/reorder",
        json={"items": [{"product_id": prod_id, "sort_order": 0}]},
    )
    assert add_item_resp.status_code == 200

    # 9. Admin activates section (already active, ensure verified)
    act_resp = await client.put(
        f"/api/v1/admin/sections/{sec_id}",
        json={"is_active": True},
    )
    assert act_resp.status_code == 200
    assert act_resp.json()["is_active"] is True

    # 10. Admin changes shop status
    status_override_resp = await client.post(
        "/api/v1/admin/store/override",
        json={
            "override_mode": "FORCE_OPEN",
            "override_banner": "Grand Onam Collection is Live in Store!",
        },
    )
    assert status_override_resp.status_code == 200

    # 11. Customer opens website -> sees shop status
    cust_status_resp = await client.get("/api/v1/public/store/status")
    assert cust_status_resp.status_code == 200
    assert cust_status_resp.json()["is_open"] is True
    assert cust_status_resp.json()["banner_message"] == "Grand Onam Collection is Live in Store!"

    # 12. Customer sees the section
    cust_sec_resp = await client.get("/api/v1/public/sections")
    assert cust_sec_resp.status_code == 200
    cust_sections = cust_sec_resp.json()
    matching_section = next((s for s in cust_sections if s["id"] == sec_id), None)
    assert matching_section is not None
    assert matching_section["title"] == "Kerala Traditional Handlooms"

    # 13. Customer sees product
    cust_prods_resp = await client.get(f"/api/v1/public/products?category={cat_slug}")
    assert cust_prods_resp.status_code == 200
    assert cust_prods_resp.json()["total"] >= 1
    found_item = next((p for p in cust_prods_resp.json()["items"] if p["id"] == prod_id), None)
    assert found_item is not None
    assert found_item["name"] == "Balaramapuram Pure Cotton Set Mundu"

    # Detail page
    cust_detail_resp = await client.get(f"/api/v1/public/products/{prod_slug}")
    assert cust_detail_resp.status_code == 200
    cust_detail = cust_detail_resp.json()
    assert cust_detail["name"] == "Balaramapuram Pure Cotton Set Mundu"
    assert len(cust_detail["images"]) == 2

    # 14. Customer sees correct available variations
    detail_variants = cust_detail["variants"]
    disabled_v = next(v for v in detail_variants if v["id"] == var_to_disable)
    active_v = next(v for v in detail_variants if v["id"] == var_to_keep)
    assert disabled_v["is_available"] is False
    assert active_v["is_available"] is True

    # 15. Customer does NOT see price when not set
    assert cust_detail.get("price") is None
    assert "mrp" not in cust_detail
    assert "cost" not in cust_detail
    assert "amount" not in cust_detail
    for v in detail_variants:
        assert "price" not in v
        assert "cost" not in v

    # 16. Customer saves product (wishlist availability query)
    avail_check_resp = await client.post(
        "/api/v1/public/saved-items/availability",
        json={"product_ids": [prod_id]},
    )
    assert avail_check_resp.status_code == 200
    avail_items = avail_check_resp.json()
    assert len(avail_items) == 1
    assert avail_items[0]["product_id"] == prod_id
    assert avail_items[0]["is_available"] is True

    # 17. Customer searches / filters products
    search_resp = await client.get("/api/v1/public/products?search=Balaramapuram")
    assert search_resp.status_code == 200
    assert any(p["id"] == prod_id for p in search_resp.json()["items"])

    subcat_filter_resp = await client.get(f"/api/v1/public/products?subcategory={subcat_slug}")
    assert subcat_filter_resp.status_code == 200
    assert any(p["id"] == prod_id for p in subcat_filter_resp.json()["items"])

    # 18. Admin changes product availability (master sold-out toggle)
    prod_avail_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/sold-out",
        json={"manual_sold_out": True},
    )
    assert prod_avail_resp.status_code == 200
    assert prod_avail_resp.json()["manual_sold_out"] is True
    assert prod_avail_resp.json()["is_available"] is False

    # 19. Customer sees updated availability
    cust_updated_detail = await client.get(f"/api/v1/public/products/{prod_slug}")
    assert cust_updated_detail.status_code == 200
    assert cust_updated_detail.json()["is_available"] is False

    in_stock_filter_resp = await client.get("/api/v1/public/products?available_only=true")
    assert in_stock_filter_resp.status_code == 200
    assert not any(p["id"] == prod_id for p in in_stock_filter_resp.json()["items"])

    # 20. Admin disables section
    sec_deact_resp = await client.put(
        f"/api/v1/admin/sections/{sec_id}",
        json={"is_active": False},
    )
    assert sec_deact_resp.status_code == 200
    assert sec_deact_resp.json()["is_active"] is False

    # 21. Customer no longer sees section
    cust_sections_after = await client.get("/api/v1/public/sections")
    assert cust_sections_after.status_code == 200
    assert not any(s["id"] == sec_id for s in cust_sections_after.json())

    # 22. Admin changes shop status (e.g. FORCE_CLOSED)
    closed_override_resp = await client.post(
        "/api/v1/admin/store/override",
        json={
            "override_mode": "FORCE_CLOSED",
            "override_banner": "Closed for special store inventory audit",
        },
    )
    assert closed_override_resp.status_code == 200

    # 23. Customer sees new shop status
    cust_closed_status = await client.get("/api/v1/public/store/status")
    assert cust_closed_status.status_code == 200
    assert cust_closed_status.json()["is_open"] is False
    assert cust_closed_status.json()["banner_message"] == "Closed for special store inventory audit"

    # 24. Customer accesses location / contact information
    store_profile_resp = await client.get("/api/v1/public/store")
    assert store_profile_resp.status_code == 200
    profile = store_profile_resp.json()
    assert "address_line1" in profile
    assert "pincode" in profile
    assert len(profile["schedules"]) == 7

    # 25. Customer can contact shop (valid WhatsApp number exists)
    assert profile["whatsapp_number"] is not None
    assert len(profile["whatsapp_number"]) >= 10

    # 26. Customer removes saved item
    sync_remove_resp = await client.post(
        "/api/v1/public/saved-items/sync",
        json={
            "session_token": "customer_session_token_xyz",
            "product_ids": [],
        },
    )
    assert sync_remove_resp.status_code == 200
    assert sync_remove_resp.json()["total_saved"] == 0
