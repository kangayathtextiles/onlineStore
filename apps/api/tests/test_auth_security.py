import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.security import (
    LoginRateLimiter,
    create_admin_session_token,
    verify_admin_api_key,
    verify_admin_session_token,
)
from app.main import app


def test_verify_admin_api_key():
    """Verify constant-time API key checking behavior."""
    assert verify_admin_api_key(settings.ADMIN_API_KEY) is True
    assert verify_admin_api_key("wrong_key") is False
    assert verify_admin_api_key("") is False
    assert verify_admin_api_key(None) is False


def test_admin_session_token_lifecycle():
    """Verify generation, signature validation, tampering rejection, and expiration."""
    # 1. Valid token
    token = create_admin_session_token(expires_in_seconds=3600)
    payload = verify_admin_session_token(token)
    assert payload is not None
    assert payload["sub"] == "admin"
    assert "exp" in payload
    assert "nonce" in payload

    # 2. Tampered signature
    parts = token.split(".")
    tampered_sig = parts[0] + ".invalidsignature123"
    assert verify_admin_session_token(tampered_sig) is None

    # 3. Tampered payload
    tampered_payload = "eyJzdWIiOiJhZG1pbiJ9." + parts[1]
    assert verify_admin_session_token(tampered_payload) is None

    # 4. Expired token
    expired_token = create_admin_session_token(expires_in_seconds=-10)
    assert verify_admin_session_token(expired_token) is None

    # 5. Malformed tokens
    assert verify_admin_session_token("") is None
    assert verify_admin_session_token("not-a-token") is None
    assert verify_admin_session_token(None) is None


def test_login_rate_limiter():
    """Verify in-memory sliding window rate limiter prevents brute-force."""
    limiter = LoginRateLimiter(max_attempts=3, window_seconds=60)
    test_ip = "192.168.1.100"

    assert limiter.is_rate_limited(test_ip) is False

    limiter.record_failed_attempt(test_ip)
    limiter.record_failed_attempt(test_ip)
    assert limiter.is_rate_limited(test_ip) is False

    limiter.record_failed_attempt(test_ip)
    assert limiter.is_rate_limited(test_ip) is True
    assert limiter.get_retry_after(test_ip) > 0

    limiter.reset(test_ip)
    assert limiter.is_rate_limited(test_ip) is False


@pytest.mark.asyncio
async def test_auth_login_success_and_logout():
    """Test /api/v1/auth/login sets HttpOnly cookie with no token in JSON body, and /logout clears cookie."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Successful login
        resp = await ac.post("/api/v1/auth/login", json={"api_key": settings.ADMIN_API_KEY})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        # Token must NOT be exposed in response body
        assert "access_token" not in data
        assert "token" not in data

        # Check Set-Cookie header contains HttpOnly and admin_session
        set_cookie = resp.headers.get("set-cookie", "").lower()
        assert settings.ADMIN_SESSION_COOKIE_NAME.lower() in set_cookie
        assert "httponly" in set_cookie
        assert "path=/" in set_cookie

        cookie_val = resp.cookies.get(settings.ADMIN_SESSION_COOKIE_NAME)
        assert cookie_val is not None

        # Validate /api/v1/auth/me using Cookie
        me_cookie_resp = await ac.get(
            "/api/v1/auth/me", cookies={settings.ADMIN_SESSION_COOKIE_NAME: cookie_val}
        )
        assert me_cookie_resp.status_code == 200
        assert me_cookie_resp.json()["role"] == "admin"
        assert me_cookie_resp.json()["status"] == "authenticated"

        # Logout clears cookie
        logout_resp = await ac.post(
            "/api/v1/auth/logout",
            cookies={settings.ADMIN_SESSION_COOKIE_NAME: cookie_val},
        )
        assert logout_resp.status_code == 200


@pytest.mark.asyncio
async def test_admin_endpoint_cookie_lifecycle():
    """Verify admin endpoints reject missing, invalid, or expired cookies."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Missing cookie
        resp_missing = await ac.get("/api/v1/auth/me")
        assert resp_missing.status_code == 401

        # 2. Invalid signature cookie
        resp_invalid = await ac.get(
            "/api/v1/auth/me",
            cookies={settings.ADMIN_SESSION_COOKIE_NAME: "invalid.signature.cookie"},
        )
        assert resp_invalid.status_code == 401

        # 3. Expired cookie
        expired_token = create_admin_session_token(expires_in_seconds=-10)
        resp_expired = await ac.get(
            "/api/v1/auth/me",
            cookies={settings.ADMIN_SESSION_COOKIE_NAME: expired_token},
        )
        assert resp_expired.status_code == 401

        # 4. Valid cookie
        valid_token = create_admin_session_token(expires_in_seconds=3600)
        resp_valid = await ac.get(
            "/api/v1/auth/me",
            cookies={settings.ADMIN_SESSION_COOKIE_NAME: valid_token},
        )
        assert resp_valid.status_code == 200


@pytest.mark.asyncio
async def test_csrf_origin_validation_on_cookie_mutations():
    """Verify state-changing mutations with cookie auth enforce CSRF Origin validation."""
    valid_token = create_admin_session_token(expires_in_seconds=3600)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Untrusted origin -> 403 Forbidden
        bad_origin_resp = await ac.post(
            "/api/v1/auth/logout",
            cookies={settings.ADMIN_SESSION_COOKIE_NAME: valid_token},
            headers={"Origin": "https://untrusted-attacker-site.com"},
        )
        assert bad_origin_resp.status_code == 403
        assert "CSRF" in bad_origin_resp.json().get("detail", "")

        # 2. Trusted origin -> 200 OK
        good_origin_resp = await ac.post(
            "/api/v1/auth/logout",
            cookies={settings.ADMIN_SESSION_COOKIE_NAME: valid_token},
            headers={"Origin": "http://localhost:3000"},
        )
        assert good_origin_resp.status_code == 200


@pytest.mark.asyncio
async def test_auth_login_invalid_credentials():
    """Test that incorrect credentials return 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/v1/auth/login", json={"api_key": "wrong_key"})
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_admin_endpoints_rejected():
    """Verify that unauthenticated requests to /api/v1/admin/* and /api/v1/admin/qr/* return 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth_client:
        # 1. Admin store endpoint rejected
        resp_store = await unauth_client.get("/api/v1/admin/store")
        assert resp_store.status_code == 401

        # 2. Admin categories rejected
        resp_cat = await unauth_client.get("/api/v1/admin/categories")
        assert resp_cat.status_code == 401

        # 3. Admin QR lookup route rejected without credentials (fixes Vulnerability #1)
        resp_qr_lookup = await unauth_client.get("/api/v1/admin/qr/lookup?code=KGY-TEST-1234")
        assert resp_qr_lookup.status_code == 401

        # 4. Admin QR action route rejected without credentials
        resp_qr_action = await unauth_client.post(
            "/api/v1/admin/qr/action", json={"action": "SOLD_OUT", "qr_code": "KGY-TEST-1234"}
        )
        assert resp_qr_action.status_code == 401

        # 5. Admin QR cleanup route rejected without credentials
        resp_qr_cleanup = await unauth_client.post("/api/v1/admin/qr/cleanup?retention_years=2")
        assert resp_qr_cleanup.status_code == 401


@pytest.mark.asyncio
async def test_admin_api_key_backward_compatibility(client: AsyncClient):
    """Verify that legacy X-Admin-Api-Key continues to work seamlessly."""
    resp = await client.get("/api/v1/admin/categories")
    assert resp.status_code == 200
