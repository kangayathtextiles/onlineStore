from app.core.config import Settings


def test_settings_initialization() -> None:
    """Ensure core settings load correctly with default values."""
    settings = Settings()
    assert settings.PROJECT_NAME == "Kangayath Web API"
    assert settings.VERSION == "1.0.0"
    assert settings.API_V1_STR == "/api/v1"
    assert settings.API_PORT == 8000
    assert "postgresql" in settings.SQLALCHEMY_DATABASE_URI
