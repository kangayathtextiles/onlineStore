from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.core.config import Settings, settings
from app.services import storage_service


def test_production_storage_validation() -> None:
    """Ensure production/staging mode requires STORAGE_BACKEND=supabase and valid credentials."""
    valid_key = "a" * 32
    valid_secret = "s" * 32

    # 1. Local backend is forbidden in production
    with pytest.raises(ValueError, match="STORAGE_BACKEND cannot be 'local'"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=valid_secret,
            ADMIN_API_KEY=valid_key,
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
            STORAGE_BACKEND="local",
        )

    # 2. Supabase backend without credentials in production fails
    with pytest.raises(ValueError, match="Supabase Storage credentials"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=valid_secret,
            ADMIN_API_KEY=valid_key,
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
            STORAGE_BACKEND="supabase",
            SUPABASE_URL="",
            SUPABASE_SERVICE_ROLE_KEY="",
        )

    # 3. Valid Supabase configuration in production succeeds
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=valid_secret,
        ADMIN_API_KEY=valid_key,
        DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        STORAGE_BACKEND="supabase",
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY="valid-service-role-key-12345",
        SUPABASE_STORAGE_BUCKET="product-media",
    )
    assert prod_settings.STORAGE_BACKEND == "supabase"


def test_path_sanitization_traversal_prevention() -> None:
    """Ensure sanitize_object_path rejects directory traversal attempts."""
    with pytest.raises(ValueError, match="Path traversal detected"):
        storage_service.sanitize_object_path("../secret.txt")

    with pytest.raises(ValueError, match="Path traversal detected"):
        storage_service.sanitize_object_path("products/../../etc/passwd")

    with pytest.raises(ValueError, match="Object path cannot be empty"):
        storage_service.sanitize_object_path("")

    # Valid paths are properly cleaned
    assert storage_service.sanitize_object_path("/products/shirt.jpg") == "products/shirt.jpg"
    assert storage_service.sanitize_object_path("uploads\\image.png") == "uploads/image.png"


@pytest.mark.asyncio
async def test_local_storage_backend_upload_and_delete(tmp_path: Path) -> None:
    """Test local storage backend writes files to disk and removes them on delete."""
    with patch.object(settings, "STORAGE_BACKEND", "local"):
        with patch.object(settings, "MEDIA_ROOT", str(tmp_path)):
            content = b"sample-binary-image-data"
            object_path = "uploads/test_item.jpg"

            # 1. Upload
            url = await storage_service.upload_file(object_path, content, "image/jpeg")
            assert url == "/media/uploads/test_item.jpg"

            # Verify file exists on disk
            saved_file = tmp_path / "uploads" / "test_item.jpg"
            assert saved_file.exists()
            assert saved_file.read_bytes() == content

            # 2. Delete
            await storage_service.delete_file(object_path)
            assert not saved_file.exists()


@pytest.mark.asyncio
async def test_supabase_storage_backend_with_mocked_client() -> None:
    """Test Supabase storage backend dispatches correctly formatted HTTP request with sanitized path."""
    with patch.object(settings, "STORAGE_BACKEND", "supabase"):
        with patch.object(settings, "SUPABASE_URL", "https://xyz.supabase.co"):
            with patch.object(settings, "SUPABASE_SERVICE_ROLE_KEY", "test-key"):
                with patch.object(settings, "SUPABASE_STORAGE_BUCKET", "product-media"):
                    mock_resp = httpx.Response(201, request=httpx.Request("POST", "https://test"))

                    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                        mock_post.return_value = mock_resp

                        url = await storage_service.upload_file(
                            "products/sari.webp", b"webp-bytes", "image/webp"
                        )

                        assert (
                            url
                            == "https://xyz.supabase.co/storage/v1/object/public/product-media/products/sari.webp"
                        )
                        mock_post.assert_awaited_once()
                        call_args = mock_post.await_args
                        assert (
                            call_args[0][0]
                            == "https://xyz.supabase.co/storage/v1/object/product-media/products/sari.webp"
                        )
                        assert call_args[1]["content"] == b"webp-bytes"
                        assert call_args[1]["headers"]["Authorization"] == "Bearer test-key"
                        assert call_args[1]["headers"]["Content-Type"] == "image/webp"
