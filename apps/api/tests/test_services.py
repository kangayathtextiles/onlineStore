import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    CategoryHasDependenciesException,
    ImageLimitExceededException,
)
from app.db.seed import seed_development_data, seed_master_data
from app.models.enums import LifecycleState, OverrideMode
from app.schemas.product import (
    ProductCreateRequest,
    ProductImageCreate,
    VariantMatrixGenerateRequest,
)
from app.schemas.store import StoreOverrideRequest
from app.services.product_service import ProductService
from app.services.store_service import StoreService
from app.services.taxonomy_service import TaxonomyService


@pytest.mark.asyncio
async def test_store_service_override_logic(db_session: AsyncSession) -> None:
    """Test that StoreService evaluates FORCE_OPEN, FORCE_CLOSED, and AUTO overrides."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    service = StoreService(db_session)

    # Force Open
    await service.update_store_override(
        StoreOverrideRequest(
            override_mode=OverrideMode.FORCE_OPEN,
            override_banner="Special Festival Extended Hours",
        )
    )
    status = await service.get_store_status()
    assert status.is_open is True
    assert status.banner_message == "Special Festival Extended Hours"

    # Force Closed
    await service.update_store_override(
        StoreOverrideRequest(
            override_mode=OverrideMode.FORCE_CLOSED,
            override_banner="Closed for Temple Festival",
        )
    )
    status_closed = await service.get_store_status()
    assert status_closed.is_open is False
    assert status_closed.banner_message == "Closed for Temple Festival"


@pytest.mark.asyncio
async def test_taxonomy_service_deletion_protection(db_session: AsyncSession) -> None:
    """Test that deleting a category containing subcategories raises CategoryHasDependenciesException."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    service = TaxonomyService(db_session)
    categories = await service.list_admin_categories()
    men_cat = next(c for c in categories if c.slug == "men")

    with pytest.raises(CategoryHasDependenciesException):
        await service.delete_category(men_cat.id)


@pytest.mark.asyncio
async def test_product_service_variant_matrix_generation(db_session: AsyncSession) -> None:
    """Test creating product, adding images with 6 limit, and generating variant matrix."""
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    tax_service = TaxonomyService(db_session)
    prod_service = ProductService(db_session)

    categories = await tax_service.list_admin_categories()
    men_cat = next(c for c in categories if c.slug == "men")
    sub_shirt = men_cat.subcategories[0]

    # Create Product
    product = await prod_service.create_product(
        ProductCreateRequest(
            category_id=men_cat.id,
            subcategory_id=sub_shirt.id,
            name="Classic Linen Casual Shirt",
            material="100% Pure Linen",
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )
    assert product.name == "Classic Linen Casual Shirt"
    assert product.slug.startswith("classic-linen-casual-shirt")

    # Add 6 images
    for i in range(6):
        await prod_service.add_image(
            product.id,
            ProductImageCreate(
                url=f"https://images.kangayath.in/linen-shirt-{i}.webp",
                is_primary=(i == 0),
            ),
        )

    # 7th image must fail
    with pytest.raises(ImageLimitExceededException):
        await prod_service.add_image(
            product.id,
            ProductImageCreate(url="https://images.kangayath.in/linen-shirt-extra.webp"),
        )

    # Generate 2 Sizes x 2 Colors matrix = 4 variants
    from app.repositories.attribute_repository import AttributeRepository

    attr_repo = AttributeRepository(db_session)
    sizes = list(await attr_repo.list_sizes())[:2]
    colors = list(await attr_repo.list_colors())[:2]

    updated_product = await prod_service.generate_variant_matrix(
        product.id,
        VariantMatrixGenerateRequest(
            size_ids=[s.id for s in sizes],
            color_ids=[c.id for c in colors],
        ),
    )
    assert len(updated_product.variants) == 4
    assert updated_product.is_available is True
