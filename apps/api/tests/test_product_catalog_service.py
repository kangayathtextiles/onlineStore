import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundException
from app.db.seed import seed_development_data, seed_master_data
from app.models.enums import LifecycleState
from app.schemas.product import ProductCreateRequest
from app.services.product_catalog_service import ProductCatalogService
from app.services.product_service import ProductService
from app.services.taxonomy_service import TaxonomyService


@pytest.mark.asyncio
async def test_product_catalog_service_queries(db_session: AsyncSession) -> None:
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    catalog_service = ProductCatalogService(db_session)
    prod_service = ProductService(db_session)
    tax_service = TaxonomyService(db_session)

    categories = await tax_service.list_admin_categories()
    men_cat = categories[0]
    sub = men_cat.subcategories[0]

    # Create published product
    product = await prod_service.create_product(
        ProductCreateRequest(
            category_id=men_cat.id,
            subcategory_id=sub.id,
            name="Catalog Test Linen Kurta",
            material="100% Linen",
            price=2499,
            show_price=True,
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )

    # 1. Public catalog list
    res = await catalog_service.list_public_products(
        category_slug=men_cat.slug,
        search="Linen Kurta",
        page=1,
        page_size=10,
    )
    assert res.total >= 1
    found = next((p for p in res.items if p.id == product.id), None)
    assert found is not None
    assert found.name == "Catalog Test Linen Kurta"

    # 2. Public detail by slug
    detail = await catalog_service.get_public_product_by_slug(product.slug)
    assert detail.id == product.id
    assert detail.material == "100% Linen"

    # 3. Public detail not found error
    with pytest.raises(EntityNotFoundException):
        await catalog_service.get_public_product_by_slug("non-existent-slug-xyz")

    # 4. Admin product list
    admin_list = await catalog_service.list_admin_products(
        category_id=men_cat.id,
        search="Linen Kurta",
    )
    assert admin_list.total >= 1
    assert any(p.id == product.id for p in admin_list.items)

    # 5. Admin get by ID
    admin_item = await catalog_service.get_admin_product_by_id(product.id)
    assert admin_item.id == product.id

    # 6. Global visibility settings
    show_prices, show_styles = await catalog_service.get_global_visibility_settings()
    assert isinstance(show_prices, bool)
    assert isinstance(show_styles, bool)
