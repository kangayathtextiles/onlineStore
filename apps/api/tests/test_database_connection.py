"""
Database Connection and Authentication Verification Tests.

Validates that:
1. Application AsyncEngine and AsyncSession authenticate to PostgreSQL.
2. SELECT 1 query succeeds.
3. TaxonomyRepository.list_categories() returns categories without error.
4. Admin Categories endpoint (/api/v1/admin/categories) returns 200 OK.
5. Intentionally bad credentials fail safely without password exposure in logs.
"""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import pool, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.dependencies import get_async_session
from app.main import app
from app.repositories.taxonomy_repository import TaxonomyRepository


@pytest.fixture
async def live_pg_engine():
    """Create a clean AsyncEngine for the active test event loop."""
    eng = create_async_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        echo=False,
        poolclass=pool.NullPool,
    )
    try:
        async with eng.connect() as conn:
            await conn.execute(text("SELECT 1;"))
    except Exception as exc:
        await eng.dispose()
        pytest.skip(f"Live PostgreSQL server is not reachable in this test environment: {exc}")

    yield eng
    await eng.dispose()


@pytest.fixture
async def live_pg_session(live_pg_engine) -> AsyncGenerator[AsyncSession, None]:
    """Async session bound to the active test loop against live PostgreSQL."""
    session_maker = async_sessionmaker(
        live_pg_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_maker() as session:
        yield session


@pytest.mark.asyncio
async def test_direct_sqlalchemy_async_connectivity(live_pg_engine) -> None:
    """Test A & B: Verify SQLAlchemy AsyncEngine connects and authenticates."""
    async with live_pg_engine.connect() as conn:
        result = await conn.execute(text("SELECT 1 AS probe;"))
        row = result.scalar_one()
        assert row == 1


@pytest.mark.asyncio
async def test_async_session_execution(live_pg_session) -> None:
    """Test C: Verify AsyncSession executes queries against PostgreSQL."""
    result = await live_pg_session.execute(text("SELECT current_user, current_database();"))
    user, db = result.one()
    assert user == settings.POSTGRES_USER
    assert db == settings.POSTGRES_DB


@pytest.mark.asyncio
async def test_taxonomy_repository_list_categories(live_pg_session) -> None:
    """Test D: Verify TaxonomyRepository retrieves categories from live database."""
    repo = TaxonomyRepository(live_pg_session)
    categories = await repo.list_categories(active_only=False)
    assert isinstance(categories, list)
    assert len(categories) >= 3  # Men, Women, Kids seeded
    slugs = [c.slug for c in categories]
    assert "men" in slugs
    assert "women" in slugs
    assert "kids" in slugs


@pytest.mark.asyncio
async def test_admin_category_endpoint_live_db(live_pg_session) -> None:
    """Test E: Verify GET /api/v1/admin/categories succeeds against live database."""

    async def override_session():
        yield live_pg_session

    orig = app.dependency_overrides.get(get_async_session)
    app.dependency_overrides[get_async_session] = override_session

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get("/api/v1/admin/categories")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) >= 3
            cat_names = [c["name"] for c in data]
            assert "Men" in cat_names
            assert "Women" in cat_names
            assert "Kids" in cat_names
    finally:
        if orig is not None:
            app.dependency_overrides[get_async_session] = orig
        else:
            app.dependency_overrides.pop(get_async_session, None)


@pytest.mark.asyncio
async def test_failure_safety_with_invalid_credentials() -> None:
    """Test F: Intentionally invalid password fails gracefully without leaking secrets."""
    bad_uri = (
        f"postgresql+asyncpg://{settings.POSTGRES_USER}:wrong_invalid_password_xyz@"
        f"{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )

    bad_engine = create_async_engine(bad_uri, poolclass=pool.NullPool)
    try:
        with pytest.raises(Exception) as exc_info:
            async with bad_engine.connect() as conn:
                await conn.execute(text("SELECT 1;"))

        # Verify failure is raised and does NOT log or expose plaintext password
        err_msg = str(exc_info.value)
        assert "wrong_invalid_password_xyz" not in err_msg
    finally:
        await bad_engine.dispose()


def test_configuration_consistency() -> None:
    """Test G: Verify runtime database configuration attributes."""
    assert settings.POSTGRES_USER == "kangayath_user"
    assert settings.POSTGRES_DB == "kangayath_db"
    assert "postgresql+asyncpg" in settings.SQLALCHEMY_DATABASE_URI
    assert settings.POSTGRES_SERVER in ["localhost", "127.0.0.1", "postgres"]
