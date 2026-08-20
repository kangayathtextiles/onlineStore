from typing import Annotated, Any, Literal

from pydantic import (
    BeforeValidator,
    PostgresDsn,
    computed_field,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
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
    PROJECT_NAME: str = "Kangayath Web API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

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

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
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


settings = Settings()
