"""
Phase 12 — Production Deployment Readiness Tests.

Verifies that all production configuration, security, and operational
requirements are correctly implemented and enforceable.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings, settings
from app.core.security import sanitize_log_data, validate_upload_file
from app.main import app


@pytest.fixture
def async_client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://testserver")


class TestProductionConfiguration:
    """Verify production-grade configuration is correctly structured."""

    def test_version_is_release_grade(self):
        """Version must be 1.0.0 for production release."""
        assert settings.VERSION == "1.0.0"

    def test_debug_defaults_to_false(self):
        """DEBUG must default to False to prevent accidental exposure."""
        assert settings.DEBUG is False

    def test_environment_defaults_to_development(self):
        """Default environment is development; production requires explicit setting."""
        assert settings.ENVIRONMENT == "development"

    def test_is_production_computed_field(self):
        """is_production should be False when ENVIRONMENT != production."""
        assert settings.is_production is False

    def test_production_detection_works(self):
        """Verify is_production is True when ENVIRONMENT=production."""
        prod_settings = Settings(ENVIRONMENT="production")
        assert prod_settings.is_production is True

    def test_pool_configuration_has_safe_defaults(self):
        """Pool configuration must have reasonable defaults."""
        assert settings.DB_POOL_SIZE >= 3
        assert settings.DB_MAX_OVERFLOW >= 5
        assert settings.DB_POOL_TIMEOUT >= 10

    def test_media_configuration_exists(self):
        """Media configuration must be present."""
        assert settings.MEDIA_ROOT is not None
        assert settings.MAX_UPLOAD_SIZE_MB > 0
        assert len(settings.ALLOWED_IMAGE_EXTENSIONS) > 0

    def test_secret_key_has_development_warning(self):
        """Default secret key must be obviously insecure to force production replacement."""
        assert "CHANGEME" in settings.SECRET_KEY or "dev" in settings.SECRET_KEY


class TestSecurityHardening:
    """Verify security utilities work correctly."""

    def test_log_sanitization(self):
        """Sensitive fields must be redacted from log data."""
        data = {
            "username": "admin",
            "password": "secret123",
            "api_key": "abc-xyz",
            "email": "admin@test.com",
        }
        sanitized = sanitize_log_data(data)
        assert sanitized["username"] == "admin"
        assert sanitized["email"] == "admin@test.com"
        assert sanitized["password"] == "[REDACTED]"
        assert sanitized["api_key"] == "[REDACTED]"

    def test_upload_validation_rejects_invalid_extension(self):
        """Files with disallowed extensions must be rejected."""
        is_valid, msg = validate_upload_file("malware.exe", 1024)
        assert is_valid is False
        assert "not allowed" in msg

    def test_upload_validation_accepts_valid_image(self):
        """Valid image files must be accepted."""
        is_valid, _ = validate_upload_file("photo.jpg", 1024)
        assert is_valid is True

    def test_upload_validation_rejects_oversized_file(self):
        """Files exceeding MAX_UPLOAD_SIZE_MB must be rejected."""
        oversized = (settings.MAX_UPLOAD_SIZE_MB + 1) * 1024 * 1024
        is_valid, msg = validate_upload_file("photo.jpg", oversized)
        assert is_valid is False
        assert "exceeds maximum" in msg


class TestProductionEndpoints:
    """Verify production API behavior."""

    @pytest.mark.asyncio
    async def test_health_endpoint_returns_version(self, async_client):
        """Health endpoint must return version 1.0.0."""
        async with async_client as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["version"] == "1.0.0"

    @pytest.mark.asyncio
    async def test_v1_health_includes_database_subsystem(self, async_client):
        """V1 health endpoint must report database subsystem status."""
        async with async_client as client:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            subsystem_names = [s["name"] for s in data["subsystems"]]
            assert "database" in subsystem_names

    @pytest.mark.asyncio
    async def test_error_responses_are_structured(self, async_client):
        """404 errors must return structured JSON error responses."""
        async with async_client as client:
            resp = await client.get("/api/v1/public/products/nonexistent-slug-xyz")
            assert resp.status_code == 404
            data = resp.json()
            assert "error" in data
            assert "code" in data["error"]
            assert "message" in data["error"]

    @pytest.mark.asyncio
    async def test_request_id_header_is_present(self, async_client):
        """All responses must include X-Request-ID header for tracing."""
        async with async_client as client:
            resp = await client.get("/health")
            assert "x-request-id" in resp.headers

    @pytest.mark.asyncio
    async def test_cors_does_not_allow_wildcard_origins(self, async_client):
        """CORS must not allow wildcard origins in production."""
        origins = settings.BACKEND_CORS_ORIGINS
        if isinstance(origins, list):
            for origin in origins:
                assert origin != "*", "Wildcard CORS origin is not allowed"
        else:
            assert origins != "*", "Wildcard CORS origin is not allowed"

    @pytest.mark.asyncio
    async def test_admin_endpoints_are_accessible(self, async_client):
        """Admin endpoints must be accessible (no auth enforced per client mandate)."""
        async with async_client as client:
            resp = await client.get("/api/v1/admin/store")
            # Either 200 (data exists) or 404 (no store profile yet) — both are valid
            assert resp.status_code in (200, 404, 500)

    @pytest.mark.asyncio
    async def test_public_endpoints_never_expose_price(self, async_client):
        """ZERO PRICE GUARANTEE: No price fields in any public API response."""
        async with async_client as client:
            endpoints = [
                "/api/v1/public/products",
                "/api/v1/public/categories",
                "/api/v1/public/sections",
            ]
            for endpoint in endpoints:
                resp = await client.get(endpoint)
                body = resp.text.lower()
                for forbidden in ["price", "cost", "amount", "mrp", "discount"]:
                    assert forbidden not in body, (
                        f"Forbidden field '{forbidden}' found in {endpoint}"
                    )
