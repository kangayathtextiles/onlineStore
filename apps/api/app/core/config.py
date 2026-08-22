import json
from typing import Annotated, Any, Literal

from pydantic import (
    BeforeValidator,
    PostgresDsn,
    computed_field,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str]:
    if isinstance(v, str):
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(i).strip() for i in parsed if str(i).strip()]
            except Exception:
                pass
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list):
        return [str(i).strip() for i in v if str(i).strip()]
    raise ValueError(v)


class Settings(BaseSettings):
    """
    Authoritative Application Settings.
    Environment variables are parsed and validated at application startup.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Environment
    ENVIRONMENT: Literal["development", "test", "staging", "production"] = "development"
    DEBUG: bool = False
    PROJECT_NAME: str = "Kangayath Web API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # Security
    SECRET_KEY: str = "CHANGEME-dev-only-insecure-key"

    # Server binding
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # CORS
    BACKEND_CORS_ORIGINS: Annotated[list[str] | str, BeforeValidator(parse_cors)] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "kangayath_user"
    POSTGRES_PASSWORD: str = "kangayath_dev_password"
    POSTGRES_DB: str = "kangayath_db"
    DATABASE_URL: str | None = None

    # Database pool configuration
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # Media / uploads
    MEDIA_ROOT: str = "./media"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: str = ".jpg,.jpeg,.png,.webp,.gif"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def RESOLVED_MEDIA_ROOT(self) -> str:
        """
        Returns an absolute deterministic path for MEDIA_ROOT.
        If MEDIA_ROOT is an absolute path (e.g. /app/media in production), returns as-is.
        If relative, resolves relative to the apps/api application root.
        """
        import os
        from pathlib import Path

        if os.path.isabs(self.MEDIA_ROOT):
            return self.MEDIA_ROOT
        api_root = Path(__file__).resolve().parent.parent.parent
        return str((api_root / self.MEDIA_ROOT.lstrip(".\\/")).resolve())

    # Site URL (used for canonical URLs, sitemap, etc.)
    SITE_URL: str = "http://localhost:3000"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            # Render injects DATABASE_URL as postgres:// — asyncpg requires postgresql+asyncpg://
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        return str(
            PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                path=self.POSTGRES_DB,
            )
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
