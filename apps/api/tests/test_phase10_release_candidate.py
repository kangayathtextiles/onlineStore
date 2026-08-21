import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data


@pytest.mark.asyncio
async def test_release_candidate_complete_system_loop(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Comprehensive Phase 10 Release Candidate verification testing the complete Admin -> DB -> Public lifecycle."""
    # 1. Master & Initial Store Seed
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    # 2. Store Profile Configuration
    store_update_payload = {
        "name": "Kangayath Clothing Showroom",
        "tagline": "Authentic Kerala Handlooms & Silk Collections",
        "primary_phone": "+91-98765-43210",
        "whatsapp_number": "+91-98765-43210",
        "address_line1": "Main Bazaar Road, Near Central Circle",
        "address_line2": "Opposite Town Hall",
        "locality": "Central Junction",
        "panchayat": "Thrissur",
        "district": "Thrissur",
        "state": "Kerala",
        "pincode": "680001",
        "latitude": 10.5276,
        "longitude": 76.2144,
        "google_maps_url": "https://maps.google.com/?q=Kangayath+Thrissur",
    }
    store_resp = await client.put("/api/v1/admin/store", json=store_update_payload)
    assert store_resp.status_code == 200
    assert store_resp.json()["name"] == "Kangayath Clothing Showroom"

    # Public store profile verification
    pub_store_resp = await client.get("/api/v1/public/store")
    assert pub_store_resp.status_code == 200
    assert pub_store_resp.json()["district"] == "Thrissur"

    # 3. Store Emergency Override Management
    override_resp = await client.post(
        "/api/v1/admin/store/override",
        json={
            "override_mode": "FORCE_OPEN",
            "override_banner": "Open Special Sunday for Festive Season",
        },
    )
    assert override_resp.status_code == 200
    assert override_resp.json()["effective_mode"] == "FORCE_OPEN"
    assert override_resp.json()["is_open"] is True

    pub_status_resp = await client.get("/api/v1/public/store/status")
    assert pub_status_resp.status_code == 200
    assert pub_status_resp.json()["is_open"] is True
    assert "Open Special Sunday" in (pub_status_resp.json()["banner_message"] or "")

    # Reset to AUTO
    await client.post("/api/v1/admin/store/override", json={"override_mode": "AUTO"})

    # 4. Taxonomy: Category and Subcategory Lifecycle
    cat_resp = await client.post(
        "/api/v1/admin/categories",
        json={
            "name": "Wedding Silks",
            "description": "Exquisite bridal and groom wedding collections",
            "thumbnail_url": "https://images.kangayath.in/wedding-silks-thumb.webp",
        },
    )
    assert cat_resp.status_code == 201
    cat_id = cat_resp.json()["id"]
    cat_slug = cat_resp.json()["slug"]

    subcat_resp = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={
            "category_id": cat_id,
            "name": "Kanchipuram Silk Sarees",
        },
    )
    assert subcat_resp.status_code == 201
    subcat_id = subcat_resp.json()["id"]
    subcat_slug = subcat_resp.json()["slug"]

    # Verify Public Category Tree
    tree_resp = await client.get("/api/v1/public/categories")
    assert tree_resp.status_code == 200
    found_cat = next((c for c in tree_resp.json() if c["id"] == cat_id), None)
    assert found_cat is not None
    assert len(found_cat["subcategories"]) >= 1

    # 5. Product Creation & Management
    prod_payload = {
        "category_id": cat_id,
        "subcategory_id": subcat_id,
        "name": "Pure Zari Bridal Kanchipuram Saree",
        "description": "Handwoven silk saree featuring intricate gold zari peacock motifs.",
        "material": "100% Mulberry Silk & Gold Zari",
        "style_code": "KAN-SILK-2026",
        "featured": True,
    }
    prod_resp = await client.post("/api/v1/admin/products", json=prod_payload)
    assert prod_resp.status_code == 201
    prod_id = prod_resp.json()["id"]
    prod_slug = prod_resp.json()["slug"]

    # 6. Multi-Image Attachments
    img1_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/images",
        json={
            "url": "https://images.kangayath.in/kan-silk-front.webp",
            "alt_text": "Bridal Kanchipuram Saree Front View",
            "is_primary": True,
            "display_order": 0,
        },
    )
    assert img1_resp.status_code == 201
    prod_data = img1_resp.json()
    assert len(prod_data["images"]) == 1
    img1_id = prod_data["images"][0]["id"]

    img2_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/images",
        json={
            "url": "https://images.kangayath.in/kan-silk-pallu.webp",
            "alt_text": "Intricate Pallu Detail",
            "is_primary": False,
            "display_order": 1,
        },
    )
    assert img2_resp.status_code == 201
    prod_data = img2_resp.json()
    assert len(prod_data["images"]) == 2
    img2_id = prod_data["images"][1]["id"]

    # Reorder / switch primary image
    reorder_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/images/reorder",
        json={
            "images": [
                {"image_id": img2_id, "display_order": 0, "is_primary": True},
                {"image_id": img1_id, "display_order": 1, "is_primary": False},
            ]
        },
    )
    assert reorder_resp.status_code == 200

    # Delete secondary image
    del_img_resp = await client.delete(f"/api/v1/admin/products/{prod_id}/images/{img1_id}")
    assert del_img_resp.status_code == 200
    assert len(del_img_resp.json()["images"]) == 1

    # 7. Attributes & Combinatorial Variant Matrix
    size_resp = await client.post(
        "/api/v1/admin/attributes/sizes", json={"name": "Standard Free Size", "display_order": 1}
    )
    assert size_resp.status_code == 201
    size_id = size_resp.json()["id"]

    color1_resp = await client.post(
        "/api/v1/admin/attributes/colors",
        json={"name": "Crimson Red & Gold", "hex_code": "#8B0000", "display_order": 1},
    )
    assert color1_resp.status_code == 201
    color1_id = color1_resp.json()["id"]

    color2_resp = await client.post(
        "/api/v1/admin/attributes/colors",
        json={"name": "Royal Emerald Green", "hex_code": "#004B23", "display_order": 2},
    )
    assert color2_resp.status_code == 201
    color2_id = color2_resp.json()["id"]

    # Generate Variant Matrix
    matrix_resp = await client.post(
        f"/api/v1/admin/products/{prod_id}/variants/matrix",
        json={
            "size_ids": [size_id],
            "color_ids": [color1_id, color2_id],
            "default_available": True,
        },
    )
    assert matrix_resp.status_code == 200
    variants = matrix_resp.json()["variants"]
    assert len(variants) == 2

    # Toggle one variant out of stock
    var1_id = variants[0]["id"]
    toggle_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/variants/{var1_id}/availability",
        json={"is_available": False},
    )
    assert toggle_resp.status_code == 200
    var_match = next((v for v in toggle_resp.json()["variants"] if v["id"] == var1_id), None)
    assert var_match is not None
    assert var_match["is_available"] is False

    # 8. Publish Product
    pub_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}/lifecycle",
        json={"lifecycle_state": "PUBLISHED"},
    )
    assert pub_resp.status_code == 200
    assert pub_resp.json()["lifecycle_state"] == "PUBLISHED"

    # 9. Verify Public Customer Catalog & Filtering
    catalog_resp = await client.get(
        f"/api/v1/public/products?category={cat_slug}&subcategory={subcat_slug}"
    )
    assert catalog_resp.status_code == 200
    items = catalog_resp.json()["items"]
    assert any(p["id"] == prod_id for p in items)

    # Product detail page retrieval
    detail_resp = await client.get(f"/api/v1/public/products/{prod_slug}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["name"] == "Pure Zari Bridal Kanchipuram Saree"
    assert len(detail_data["images"]) == 1
    assert len(detail_data["variants"]) == 2

    # 10. Custom Promotional Section Lifecycle
    section_resp = await client.post(
        "/api/v1/admin/sections",
        json={
            "title": "Bridal Collection 2026",
            "subtitle": "Curated wedding weaves for the grand celebration",
            "is_active": True,
            "product_ids": [prod_id],
        },
    )
    assert section_resp.status_code == 201
    sec_id = section_resp.json()["id"]

    # Verify section appears on public customer homepage
    pub_sections = await client.get("/api/v1/public/sections")
    assert pub_sections.status_code == 200
    sec_match = next((s for s in pub_sections.json() if s["id"] == sec_id), None)
    assert sec_match is not None
    assert len(sec_match["products"]) == 1

    # Deactivate section
    await client.put(f"/api/v1/admin/sections/{sec_id}", json={"is_active": False})
    pub_sections_after = await client.get("/api/v1/public/sections")
    assert not any(s["id"] == sec_id for s in pub_sections_after.json())

    # 11. Customer Saved Items (Wishlist) Synchronization
    session_token = "rc_customer_session_789"
    sync_resp = await client.post(
        "/api/v1/public/saved-items/sync",
        json={"session_token": session_token, "product_ids": [prod_id]},
    )
    assert sync_resp.status_code == 200
    assert sync_resp.json()["total_saved"] == 1

    avail_resp = await client.post(
        "/api/v1/public/saved-items/availability",
        json={"product_ids": [prod_id]},
    )
    assert avail_resp.status_code == 200
    assert len(avail_resp.json()) == 1
    assert avail_resp.json()[0]["product_id"] == prod_id

    # 12. Automated Zero Price Guarantee Scan across all public responses
    all_public_responses = [
        pub_store_resp.json(),
        pub_status_resp.json(),
        tree_resp.json(),
        catalog_resp.json(),
        detail_data,
        pub_sections.json(),
        sync_resp.json(),
        avail_resp.json(),
    ]

    def verify_no_price_tokens(obj: object, path: str = "") -> None:
        if isinstance(obj, dict):
            for k, v in obj.items():
                k_lower = k.lower()
                assert "price" not in k_lower, f"Forbidden 'price' key detected at {path}.{k}"
                assert "mrp" not in k_lower, f"Forbidden 'mrp' key detected at {path}.{k}"
                assert "cost" not in k_lower, f"Forbidden 'cost' key detected at {path}.{k}"
                assert "amount" not in k_lower, f"Forbidden 'amount' key detected at {path}.{k}"
                assert "currency" not in k_lower, f"Forbidden 'currency' key detected at {path}.{k}"
                verify_no_price_tokens(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, elem in enumerate(obj):
                verify_no_price_tokens(elem, f"{path}[{i}]")

    for idx, resp_obj in enumerate(all_public_responses):
        verify_no_price_tokens(resp_obj, f"response_{idx}")
