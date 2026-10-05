import pytest

from app.core.config import Settings


def test_settings_initialization() -> None:
    """Ensure core settings load correctly with default values."""
    settings = Settings()
    assert settings.PROJECT_NAME == "Kangayath Web API"
    assert settings.VERSION == "0.1.0"
    assert settings.API_V1_STR == "/api/v1"
    assert settings.API_PORT == 8000
    assert "postgresql" in settings.SQLALCHEMY_DATABASE_URI


def test_app_and_settings_smoke_import() -> None:
    """Smoke test ensuring settings and main FastAPI app import without NameError or startup crashes."""
    from app.core.config import settings as app_settings
    from app.main import app

    assert app_settings is not None
    assert app.title == "Kangayath Web API"


def test_production_admin_api_key_validation() -> None:
    """Ensure production/staging mode enforces ADMIN_API_KEY presence, length, and rejects placeholders."""
    valid_key = "a" * 32
    valid_secret = "s" * 32

    # 1. Missing or empty ADMIN_API_KEY in production raises ValueError
    with pytest.raises(ValueError, match="ADMIN_API_KEY is required"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=valid_secret,
            ADMIN_API_KEY="",
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        )

    # 2. Too short (<32 chars) in production raises ValueError
    with pytest.raises(ValueError, match="at least 32 characters"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=valid_secret,
            ADMIN_API_KEY="short_key_12345",
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        )

    # 3. Default or placeholder key in production raises ValueError
    with pytest.raises(ValueError, match="Default or placeholder ADMIN_API_KEY is not allowed"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=valid_secret,
            ADMIN_API_KEY="kangayath_admin_secret_key_12345678",
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        )

    # 4. Valid 32+ character key succeeds
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=valid_secret,
        ADMIN_API_KEY=valid_key,
        DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
    )
    assert prod_settings.ADMIN_API_KEY == valid_key


