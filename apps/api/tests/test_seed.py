import os
from unittest.mock import patch

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.seed import seed_development_data, seed_master_data
from app.models.attribute import ColorOption, SizeOption
from app.models.custom_section import CustomSection
from app.models.store import StoreProfile, StoreStatus
from app.models.taxonomy import Category, Subcategory


@pytest.mark.asyncio
async def test_seed_master_data_populates_reference_data(db_session: AsyncSession) -> None:
    """Verify seed_master_data populates sizes, colors, and store status."""
    await seed_master_data(db_session)

    sizes_count = (await db_session.execute(select(func.count(SizeOption.id)))).scalar_one()
    colors_count = (await db_session.execute(select(func.count(ColorOption.id)))).scalar_one()
    status_count = (await db_session.execute(select(func.count(StoreStatus.id)))).scalar_one()

    assert sizes_count == 16
    assert colors_count == 10
    assert status_count == 1


@pytest.mark.asyncio
async def test_seed_master_data_is_idempotent(db_session: AsyncSession) -> None:
    """Verify invoking seed_master_data multiple times produces no duplicates."""
    await seed_master_data(db_session)
    await seed_master_data(db_session)

    sizes_count = (await db_session.execute(select(func.count(SizeOption.id)))).scalar_one()
    colors_count = (await db_session.execute(select(func.count(ColorOption.id)))).scalar_one()
    status_count = (await db_session.execute(select(func.count(StoreStatus.id)))).scalar_one()

    assert sizes_count == 16
    assert colors_count == 10
    assert status_count == 1


@pytest.mark.asyncio
async def test_production_seed_does_not_seed_dev_data(db_session: AsyncSession) -> None:
    """Verify production-safe seed path creates master data but zero demo fixtures."""
    await seed_master_data(db_session)

    # Categories, Subcategories, StoreProfiles, CustomSections must not exist
    cat_count = (await db_session.execute(select(func.count(Category.id)))).scalar_one()
    subcat_count = (await db_session.execute(select(func.count(Subcategory.id)))).scalar_one()
    store_count = (await db_session.execute(select(func.count(StoreProfile.id)))).scalar_one()
    section_count = (await db_session.execute(select(func.count(CustomSection.id)))).scalar_one()

    assert cat_count == 0
    assert subcat_count == 0
    assert store_count == 0
    assert section_count == 0


@pytest.mark.asyncio
async def test_dev_seed_refuses_in_production_environment(db_session: AsyncSession) -> None:
    """Verify seed_development_data strictly rejects execution when ENVIRONMENT=production."""
    with patch.object(settings, "ENVIRONMENT", "production"):
        result = await seed_development_data(db_session, opt_in=True)
        assert result is False

    cat_count = (await db_session.execute(select(func.count(Category.id)))).scalar_one()
    assert cat_count == 0


@pytest.mark.asyncio
async def test_dev_seed_refuses_in_staging_environment(db_session: AsyncSession) -> None:
    """Verify seed_development_data strictly rejects execution when ENVIRONMENT=staging."""
    with patch.object(settings, "ENVIRONMENT", "staging"):
        result = await seed_development_data(db_session, opt_in=True)
        assert result is False

    cat_count = (await db_session.execute(select(func.count(Category.id)))).scalar_one()
    assert cat_count == 0


@pytest.mark.asyncio
async def test_dev_seed_requires_opt_in_when_not_forced(db_session: AsyncSession) -> None:
    """Verify seed_development_data requires opt-in when run outside test runner magic."""
    with patch.dict(os.environ, {}, clear=True):
        # Explicitly pass opt_in=False and remove PYTEST_CURRENT_TEST indicator
        with patch.object(settings, "ENVIRONMENT", "development"):
            result = await seed_development_data(db_session, opt_in=False)
            assert result is False

    cat_count = (await db_session.execute(select(func.count(Category.id)))).scalar_one()
    assert cat_count == 0


@pytest.mark.asyncio
async def test_dev_seed_succeeds_with_explicit_opt_in(db_session: AsyncSession) -> None:
    """Verify seed_development_data seeds fixtures when opted in in non-production."""
    await seed_master_data(db_session)
    result = await seed_development_data(db_session, opt_in=True)
    assert result is True

    cat_count = (await db_session.execute(select(func.count(Category.id)))).scalar_one()
    subcat_count = (await db_session.execute(select(func.count(Subcategory.id)))).scalar_one()
    store_count = (await db_session.execute(select(func.count(StoreProfile.id)))).scalar_one()
    section_count = (await db_session.execute(select(func.count(CustomSection.id)))).scalar_one()

    assert cat_count == 3
    assert subcat_count == 8
    assert store_count == 1
    assert section_count == 1
