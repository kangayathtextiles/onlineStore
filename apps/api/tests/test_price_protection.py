from decimal import Decimal
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_development_data, seed_master_data
from app.models.enums import LifecycleState
from app.schemas.product import ProductCreateRequest, ProductUpdateRequest
from app.schemas.store import StoreProfileUpdate
from app.schemas.taxonomy import CategoryUpdate
from app.services.product_service import ProductService
from app.services.store_service import StoreService
from app.services.taxonomy_service import TaxonomyService


@pytest.mark.asyncio
async def test_price_visibility_matrix_and_precedence(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """
    Test the 7-case price visibility matrix:
    Precedence: Global -> Category -> Product
    Global OFF always wins.
    """
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    tax_service = TaxonomyService(db_session)
    prod_service = ProductService(db_session)
    store_service = StoreService(db_session)

    categories = await tax_service.list_admin_categories()
    women_cat = next(c for c in categories if c.slug == "women")
    sub_saree = women_cat.subcategories[0]

    # Create published sample product with price 1299.00 and show_price=True
    product = await prod_service.create_product(
        ProductCreateRequest(
            category_id=women_cat.id,
            subcategory_id=sub_saree.id,
            name="Zari Border Wedding Saree",
            material="Kanchipuram Silk",
            price=Decimal("1299.00"),
            show_price=True,
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )

    # Helper function to check public product price
    async def get_public_price() -> Decimal | None:
        resp = await client.get(f"/api/v1/public/products/{product.slug}")
        assert resp.status_code == 200
        val = resp.json().get("price")
        return Decimal(str(val)) if val is not None else None

    # Case 1: Global ON, Category ON, Product ON -> price visible
    await store_service.update_store_profile(StoreProfileUpdate(show_prices=True))
    await tax_service.update_category(women_cat.id, CategoryUpdate(show_prices=True))
    await prod_service.update_product(product.id, ProductUpdateRequest(show_price=True))
    assert await get_public_price() == Decimal("1299.00")

    # Case 2: Global ON, Category ON, Product OFF -> price hidden
    await prod_service.update_product(product.id, ProductUpdateRequest(show_price=False))
    assert await get_public_price() is None

    # Case 3: Global ON, Category OFF, Product ON -> price hidden
    await tax_service.update_category(women_cat.id, CategoryUpdate(show_prices=False))
    await prod_service.update_product(product.id, ProductUpdateRequest(show_price=True))
    assert await get_public_price() is None

    # Case 4: Global ON, Category OFF, Product OFF -> price hidden
    await prod_service.update_product(product.id, ProductUpdateRequest(show_price=False))
    assert await get_public_price() is None

    # Case 5: Global OFF, Category ON, Product ON -> price hidden (Global master switch)
    await store_service.update_store_profile(StoreProfileUpdate(show_prices=False))
    await tax_service.update_category(women_cat.id, CategoryUpdate(show_prices=True))
    await prod_service.update_product(product.id, ProductUpdateRequest(show_price=True))
    assert await get_public_price() is None

    # Case 6: Global OFF, Category OFF, Product ON -> price hidden
    await tax_service.update_category(women_cat.id, CategoryUpdate(show_prices=False))
    assert await get_public_price() is None

    # Case 7: Global OFF, Category ON, Product OFF -> price hidden
    await tax_service.update_category(women_cat.id, CategoryUpdate(show_prices=True))
    await prod_service.update_product(product.id, ProductUpdateRequest(show_price=False))
    assert await get_public_price() is None


@pytest.mark.asyncio
async def test_admin_price_management_crud(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """
    Test Admin Price CRUD:
    - Create product with price
    - Edit product price
    - Toggle product price visibility
    """
    await seed_master_data(db_session)
    await seed_development_data(db_session)

    tax_service = TaxonomyService(db_session)
    categories = await tax_service.list_admin_categories()
    cat = categories[0]
    sub = cat.subcategories[0]

    # Create via admin API
    create_resp = await client.post(
        "/api/v1/admin/products",
        headers={"X-Admin-Role": "owner"},
        json={
            "category_id": str(cat.id),
            "subcategory_id": str(sub.id),
            "name": "Festive Kurta Set",
            "price": 2499.50,
            "show_price": True,
            "lifecycle_state": "PUBLISHED",
        },
    )
    assert create_resp.status_code == 201
    prod_data = create_resp.json()
    prod_id = prod_data["id"]
    assert prod_data["price"] == "2499.50" or prod_data["price"] == 2499.50 or float(prod_data["price"]) == 2499.50
    assert prod_data["show_price"] is True

    # Update price via admin API
    update_resp = await client.put(
        f"/api/v1/admin/products/{prod_id}",
        headers={"X-Admin-Role": "owner"},
        json={"price": 1999.00, "show_price": False},
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert float(updated_data["price"]) == 1999.00
    assert updated_data["show_price"] is False

