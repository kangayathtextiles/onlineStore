import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceException, EntityNotFoundException
from app.db.seed import seed_development_data, seed_master_data
from app.models.enums import LifecycleState
from app.schemas.product import (
    ProductCreateRequest,
    VariantAvailabilityUpdate,
    VariantCreateRequest,
    VariantMatrixGenerateRequest,
)
from app.services.product_presenter import (
    calculate_availability,
    map_to_admin_response,
    should_show_price,
)
from app.services.product_service import ProductService
from app.services.product_variant_service import ProductVariantService
from app.services.taxonomy_service import TaxonomyService


@pytest.mark.asyncio
async def test_product_presenter_functions(db_session: AsyncSession) -> None:
    await seed_master_data(db_session)
    await seed_development_data(db_session)
    prod_service = ProductService(db_session)
    tax_service = TaxonomyService(db_session)

    categories = await tax_service.list_admin_categories()
    men_cat = categories[0]
    sub = men_cat.subcategories[0]

    product = await prod_service.create_product(
        ProductCreateRequest(
            category_id=men_cat.id,
            subcategory_id=sub.id,
            name="Presenter Test Shirt",
            material="Cotton",
            price=1500,
            show_price=True,
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )

    # Directly verify presenter functions
    raw_product = await prod_service.repo.get_by_id(product.id)
    assert raw_product is not None

    # Availability
    assert calculate_availability(raw_product) is True

    # Price visibility logic
    assert should_show_price(raw_product, global_show_prices=True) is True
    assert should_show_price(raw_product, global_show_prices=False) is False

    # Admin response mapping
    admin_dto = map_to_admin_response(raw_product)
    assert admin_dto.id == product.id
    assert admin_dto.name == "Presenter Test Shirt"


@pytest.mark.asyncio
async def test_product_variant_service_crud_and_matrix(db_session: AsyncSession) -> None:
    await seed_master_data(db_session)
    await seed_development_data(db_session)
    prod_service = ProductService(db_session)
    variant_service = ProductVariantService(db_session)
    tax_service = TaxonomyService(db_session)

    categories = await tax_service.list_admin_categories()
    men_cat = categories[0]
    sub = men_cat.subcategories[0]

    # Create product
    product = await prod_service.create_product(
        ProductCreateRequest(
            category_id=men_cat.id,
            subcategory_id=sub.id,
            name="Variant Service Test Shirt",
            material="Silk",
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )

    from app.repositories.attribute_repository import AttributeRepository

    attr_repo = AttributeRepository(db_session)
    sizes = list(await attr_repo.list_sizes())[:2]
    colors = list(await attr_repo.list_colors())[:2]

    # Test matrix generation
    matrix_res = await variant_service.generate_variant_matrix(
        product.id,
        VariantMatrixGenerateRequest(
            size_ids=[s.id for s in sizes],
            color_ids=[c.id for c in colors],
            default_available=True,
        ),
    )
    assert len(matrix_res.variants) == 4
    assert matrix_res.is_available is True

    # Test duplicate variant creation fails
    with pytest.raises(DuplicateResourceException):
        await variant_service.add_single_variant(
            product.id,
            VariantCreateRequest(
                size_id=sizes[0].id,
                color_id=colors[0].id,
                is_available=True,
            ),
        )

    # Test update availability
    target_variant = matrix_res.variants[0]
    updated = await variant_service.update_variant_availability(
        product.id,
        target_variant.id,
        VariantAvailabilityUpdate(is_available=False),
    )
    v_updated = next(v for v in updated.variants if v.id == target_variant.id)
    assert v_updated.is_available is False

    # Test delete variant
    after_del = await variant_service.delete_variant(product.id, target_variant.id)
    assert len(after_del.variants) == 3

    # Test non-existent variant error
    with pytest.raises(EntityNotFoundException):
        await variant_service.delete_variant(product.id, uuid.uuid4())
