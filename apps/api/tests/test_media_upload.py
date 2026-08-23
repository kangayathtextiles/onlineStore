import io
import os

import pytest
from httpx import AsyncClient

from app.core.config import settings


@pytest.fixture
def sample_image_bytes() -> bytes:
    """Minimal valid PNG binary header."""
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01"
        b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )


@pytest.mark.asyncio
async def test_admin_media_upload_success(client: AsyncClient, sample_image_bytes: bytes) -> None:
    """Test successful image upload via standalone admin media endpoint."""
    files = {
        "file": ("test_kurta.png", io.BytesIO(sample_image_bytes), "image/png"),
    }
    response = await client.post("/api/v1/admin/media/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("/media/uploads/")
    assert data["filename"].endswith(".png")
    assert data["size_bytes"] == len(sample_image_bytes)

    # Verify physical file exists in RESOLVED_MEDIA_ROOT/uploads
    file_path = os.path.join(settings.RESOLVED_MEDIA_ROOT, "uploads", data["filename"])
    assert os.path.exists(file_path)


@pytest.mark.asyncio
async def test_admin_media_upload_invalid_extension(client: AsyncClient) -> None:
    """Test rejection of non-image file extensions."""
    files = {
        "file": ("malicious_script.sh", io.BytesIO(b"echo hack"), "text/x-shellscript"),
    }
    response = await client.post("/api/v1/admin/media/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_admin_media_upload_oversized_file(client: AsyncClient) -> None:
    """Test rejection of files exceeding maximum size limit (10MB)."""
    oversized_bytes = b"0" * (11 * 1024 * 1024)  # 11 MB
    files = {
        "file": ("huge_photo.jpg", io.BytesIO(oversized_bytes), "image/jpeg"),
    }
    response = await client.post("/api/v1/admin/media/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "exceeds maximum" in data["error"]["message"]


@pytest.mark.asyncio
async def test_static_media_serving(client: AsyncClient, sample_image_bytes: bytes) -> None:
    """Test that uploaded files can be fetched directly via /media static mount."""
    files = {
        "file": ("showcase.webp", io.BytesIO(sample_image_bytes), "image/webp"),
    }
    upload_res = await client.post("/api/v1/admin/media/upload", files=files)
    assert upload_res.status_code == 201
    file_url = upload_res.json()["url"]

    # Fetch static file directly
    get_res = await client.get(file_url)
    assert get_res.status_code == 200
    assert len(get_res.content) == len(sample_image_bytes)


@pytest.mark.asyncio
async def test_product_image_direct_device_upload(
    client: AsyncClient, sample_image_bytes: bytes
) -> None:
    """Test uploading an image directly to a product via multipart endpoint."""
    # 1. Create Category
    cat_res = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Menswear", "slug": "menswear", "display_order": 1},
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 2. Create Subcategory
    sub_res = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={
            "category_id": cat_id,
            "name": "Kurtas",
            "slug": "kurtas",
            "display_order": 1,
        },
    )
    assert sub_res.status_code == 201
    sub_id = sub_res.json()["id"]

    # 3. Create Product
    prod_res = await client.post(
        "/api/v1/admin/products",
        json={
            "category_id": cat_id,
            "subcategory_id": sub_id,
            "name": "Silk Festive Kurta",
            "material": "Pure Silk",
            "style_code": "KURTA-SILK-01",
        },
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 4. Upload photo from device directly to product
    files = {
        "file": ("kurta_front.jpg", io.BytesIO(sample_image_bytes), "image/jpeg"),
    }
    data = {
        "is_primary": "true",
        "alt_text": "Silk Festive Kurta Front View",
    }
    upload_res = await client.post(
        f"/api/v1/admin/products/{prod_id}/images/upload",
        files=files,
        data=data,
    )
    assert upload_res.status_code == 201
    prod_data = upload_res.json()
    assert len(prod_data["images"]) == 1
    attached_img = prod_data["images"][0]
    assert attached_img["url"].startswith("/media/products/")
    assert attached_img["is_primary"] is True
    assert attached_img["alt_text"] == "Silk Festive Kurta Front View"

    # ZERO PRICE GUARANTEE
    assert "price" not in prod_data
    assert "mrp" not in prod_data


@pytest.mark.asyncio
async def test_product_image_upload_max_limit_enforced(
    client: AsyncClient, sample_image_bytes: bytes
) -> None:
    """Test that max 6 images limit is strictly enforced on direct upload."""
    cat_res = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Sarees", "slug": "sarees", "display_order": 1},
    )
    cat_id = cat_res.json()["id"]

    sub_res = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={
            "category_id": cat_id,
            "name": "Kanchipuram",
            "slug": "kanchipuram",
            "display_order": 1,
        },
    )
    sub_id = sub_res.json()["id"]

    prod_res = await client.post(
        "/api/v1/admin/products",
        json={
            "category_id": cat_id,
            "subcategory_id": sub_id,
            "name": "Kanchipuram Pattu",
        },
    )
    prod_id = prod_res.json()["id"]

    # Upload 6 photos
    for i in range(6):
        files = {
            "file": (f"pattu_{i}.png", io.BytesIO(sample_image_bytes), "image/png"),
        }
        res = await client.post(
            f"/api/v1/admin/products/{prod_id}/images/upload",
            files=files,
            data={"is_primary": "false"},
        )
        assert res.status_code == 201

    # Attempt 7th photo upload -> should fail with IMAGE_LIMIT_EXCEEDED
    files = {
        "file": ("pattu_7.png", io.BytesIO(sample_image_bytes), "image/png"),
    }
    res7 = await client.post(
        f"/api/v1/admin/products/{prod_id}/images/upload",
        files=files,
        data={"is_primary": "false"},
    )
    assert res7.status_code == 400
    assert res7.json()["error"]["code"] == "IMAGE_LIMIT_EXCEEDED"


@pytest.mark.asyncio
async def test_media_etag_and_304_conditional_serving(
    client: AsyncClient, sample_image_bytes: bytes
) -> None:
    """Verify standard HTTP caching: 200 on initial fetch, 304 on conditional If-None-Match."""
    files = {
        "file": ("cache_test.png", io.BytesIO(sample_image_bytes), "image/png"),
    }
    upload_res = await client.post("/api/v1/admin/media/upload", files=files)
    assert upload_res.status_code == 201
    file_url = upload_res.json()["url"]

    # Initial GET -> 200 OK with ETag & Last-Modified
    initial_res = await client.get(file_url)
    assert initial_res.status_code == 200
    assert initial_res.headers.get("content-type") == "image/png"
    etag = initial_res.headers.get("etag")
    assert etag is not None

    # Conditional GET with If-None-Match -> 304 Not Modified
    cond_res = await client.get(file_url, headers={"if-none-match": etag})
    assert cond_res.status_code == 304


@pytest.mark.asyncio
async def test_media_missing_file_returns_404(client: AsyncClient) -> None:
    """Verify non-existent media files return 404 Not Found."""
    res = await client.get("/media/products/non_existent_image_0000.png")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_media_path_traversal_protection(client: AsyncClient) -> None:
    """Verify path traversal attacks through /media endpoint are blocked."""
    res = await client.get("/media/products/../../pyproject.toml")
    assert res.status_code in (404, 400)


@pytest.mark.asyncio
async def test_product_image_deletion_cleanup(
    client: AsyncClient, sample_image_bytes: bytes
) -> None:
    """Verify deleting a product image removes database record and disk file."""
    # 1. Setup category & product
    cat_res = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Kids", "slug": "kids", "display_order": 1},
    )
    cat_id = cat_res.json()["id"]

    sub_res = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={
            "category_id": cat_id,
            "name": "Traditional",
            "slug": "traditional",
            "display_order": 1,
        },
    )
    sub_id = sub_res.json()["id"]

    prod_res = await client.post(
        "/api/v1/admin/products",
        json={"category_id": cat_id, "subcategory_id": sub_id, "name": "Pattu Pavadai"},
    )
    prod_id = prod_res.json()["id"]

    # 2. Upload image
    files = {"file": ("pavadai.png", io.BytesIO(sample_image_bytes), "image/png")}
    upload_res = await client.post(
        f"/api/v1/admin/products/{prod_id}/images/upload",
        files=files,
        data={"is_primary": "true"},
    )
    assert upload_res.status_code == 201
    img_record = upload_res.json()["images"][0]
    img_id = img_record["id"]
    filename = img_record["url"].replace("/media/products/", "")
    disk_path = os.path.join(settings.RESOLVED_MEDIA_ROOT, "products", filename)
    assert os.path.exists(disk_path)

    # 3. Delete image
    del_res = await client.delete(f"/api/v1/admin/products/{prod_id}/images/{img_id}")
    assert del_res.status_code == 200
    assert len(del_res.json()["images"]) == 0

    # 4. Verify disk file cleaned up
    assert not os.path.exists(disk_path)


@pytest.mark.asyncio
async def test_media_dynamic_recovery_from_stored_media_on_disk_loss(
    client: AsyncClient, sample_image_bytes: bytes
) -> None:
    """Verify that when physical disk cache is wiped (simulating Render restart), the image recovers automatically from StoredMedia."""
    # 1. Setup category & product
    cat_res = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Silk", "slug": "silk-special", "display_order": 1},
    )
    cat_id = cat_res.json()["id"]

    sub_res = await client.post(
        "/api/v1/admin/categories/subcategories",
        json={
            "category_id": cat_id,
            "name": "Kanchipuram",
            "slug": "kanchipuram",
            "display_order": 1,
        },
    )
    sub_id = sub_res.json()["id"]

    prod_res = await client.post(
        "/api/v1/admin/products",
        json={"category_id": cat_id, "subcategory_id": sub_id, "name": "Bridal Silk Saree"},
    )
    prod_id = prod_res.json()["id"]

    # 2. Upload image
    files = {"file": ("bridal_saree.png", io.BytesIO(sample_image_bytes), "image/png")}
    upload_res = await client.post(
        f"/api/v1/admin/products/{prod_id}/images/upload",
        files=files,
        data={"is_primary": "true"},
    )
    assert upload_res.status_code == 201
    img_url = upload_res.json()["images"][0]["url"]
    filename = img_url.replace("/media/products/", "")
    disk_path = os.path.join(settings.RESOLVED_MEDIA_ROOT, "products", filename)
    assert os.path.exists(disk_path)

    # 3. Request media asset via public endpoint
    fetch_res = await client.get(img_url)
    assert fetch_res.status_code == 200
    assert fetch_res.content == sample_image_bytes

    # 4. SIMULATE CONTAINER RESTART / DISK WIPE: delete file from disk
    if os.path.exists(disk_path):
        os.remove(disk_path)
    assert not os.path.exists(disk_path)

    # 5. Request media asset again: should automatically recover from PostgreSQL StoredMedia!
    recover_res = await client.get(img_url)
    assert recover_res.status_code == 200
    assert recover_res.content == sample_image_bytes

    # 6. Verify file is also repopulated on disk cache for fast future serving
    assert os.path.exists(disk_path)
