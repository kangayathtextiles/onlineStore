import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_master_data
from app.models.attribute import ColorOption, SizeOption
from app.models.enums import LifecycleState, OverrideMode
from app.schemas.custom_section import (
    SectionCreateRequest,
    SectionItemReorderItem,
    SectionItemReorderRequest,
    SectionUpdateRequest,
)
from app.schemas.product import (
    ProductCreateRequest,
    ProductImageCreate,
    ProductLifecycleUpdate,
    ProductSoldOutUpdate,
    VariantAvailabilityUpdate,
    VariantMatrixGenerateRequest,
)
from app.schemas.saved_item import SavedItemSyncRequest
from app.schemas.taxonomy import CategoryCreate, SubcategoryCreate
from app.services.custom_section_service import CustomSectionService
from app.services.product_service import ProductService
from app.services.saved_item_service import SavedItemService
from app.services.store_service import StoreService
from app.services.taxonomy_service import TaxonomyService


@pytest.mark.asyncio
async def test_database_18_lifecycle_scenarios(db_session: AsyncSession) -> None:
    """Systematically test all 18 database lifecycle and business scenarios."""
    await seed_master_data(db_session)

    tax_svc = TaxonomyService(db_session)
    prod_svc = ProductService(db_session)
    sec_svc = CustomSectionService(db_session)
    saved_svc = SavedItemService(db_session)
    store_svc = StoreService(db_session)

    # 1. Create Category
    cat = await tax_svc.create_category(
        CategoryCreate(name="Ethnic Festive", description="Traditional festive garments")
    )
    assert cat.id is not None
    assert cat.slug == "ethnic-festive"

    # 2. Create Subcategory
    subcat = await tax_svc.create_subcategory(
        SubcategoryCreate(category_id=cat.id, name="Silk Sarees")
    )
    assert subcat.id is not None
    assert subcat.slug == "silk-sarees"
    assert subcat.category_id == cat.id

    # 3. Create Product
    prod = await prod_svc.create_product(
        ProductCreateRequest(
            category_id=cat.id,
            subcategory_id=subcat.id,
            name="Kasavu Pure Gold Zari Saree",
            material="Pure Handloom Cotton & Silk",
            style_code="KASAVU-GOLD-01",
            lifecycle_state=LifecycleState.PUBLISHED,
        )
    )
    assert prod.id is not None
    assert prod.slug == "kasavu-pure-gold-zari-saree"
    assert prod.is_available is True

    # 4. Add Multiple Images (ensure primary flag & max 6 limit constraint)
    await prod_svc.add_image(
        product_id=prod.id,
        data=ProductImageCreate(
            url="https://images.kangayath.in/kasavu-front.webp",
            alt_text="Front view of Kasavu saree",
            is_primary=True,
            display_order=0,
        ),
    )
    await prod_svc.add_image(
        product_id=prod.id,
        data=ProductImageCreate(
            url="https://images.kangayath.in/kasavu-pallu.webp",
            alt_text="Pallu detail",
            is_primary=False,
            display_order=1,
        ),
    )
    p_img3 = await prod_svc.add_image(
        product_id=prod.id,
        data=ProductImageCreate(
            url="https://images.kangayath.in/kasavu-border.webp",
            alt_text="Border detail",
            is_primary=False,
            display_order=2,
        ),
    )
    assert len(p_img3.images) == 3

    # 5. Add Multiple Sizes
    size_res1 = await db_session.execute(select(SizeOption).where(SizeOption.name == "Free Size"))
    size_free = size_res1.scalar_one()

    size_res2 = await db_session.execute(select(SizeOption).where(SizeOption.name == "L"))
    size_l = size_res2.scalar_one()

    # 6. Add Multiple Colors
    color_res1 = await db_session.execute(
        select(ColorOption).where(ColorOption.name == "Mustard Gold")
    )
    color_gold = color_res1.scalar_one()

    color_res2 = await db_session.execute(
        select(ColorOption).where(ColorOption.name == "Crimson Red")
    )
    color_red = color_res2.scalar_one()

    # 7. Create Size/Color combinations (combinatorial matrix: 2 sizes x 2 colors = 4 variants)
    prod_with_matrix = await prod_svc.generate_variant_matrix(
        product_id=prod.id,
        req=VariantMatrixGenerateRequest(
            size_ids=[size_free.id, size_l.id],
            color_ids=[color_gold.id, color_red.id],
            default_available=True,
        ),
    )
    assert len(prod_with_matrix.variants) == 4

    # 8. Mark one variation unavailable
    var_to_disable = prod_with_matrix.variants[0]
    prod_var_updated = await prod_svc.update_variant_availability(
        product_id=prod.id,
        variant_id=var_to_disable.id,
        req=VariantAvailabilityUpdate(is_available=False),
    )
    disabled_var = next(v for v in prod_var_updated.variants if v.id == var_to_disable.id)
    assert disabled_var.is_available is False

    # 9. Keep another variation available
    var_to_keep = prod_with_matrix.variants[1]
    active_var = next(v for v in prod_var_updated.variants if v.id == var_to_keep.id)
    assert active_var.is_available is True

    # 10. Mark entire master product sold out
    prod_sold_out = await prod_svc.update_sold_out_state(
        product_id=prod.id,
        data=ProductSoldOutUpdate(manual_sold_out=True),
    )
    assert prod_sold_out.manual_sold_out is True
    assert prod_sold_out.is_available is False

    # 11. Hide sold-out product / change lifecycle to ARCHIVED
    prod_archived = await prod_svc.update_lifecycle_state(
        product_id=prod.id,
        data=ProductLifecycleUpdate(lifecycle_state=LifecycleState.ARCHIVED),
    )
    assert prod_archived.lifecycle_state == LifecycleState.ARCHIVED

    # Public catalog check: must NOT return archived/hidden product
    public_paginated = await prod_svc.list_public_products()
    assert not any(p.id == prod.id for p in public_paginated.items)

    # 12. Restore stock
    await prod_svc.update_lifecycle_state(
        product_id=prod.id,
        data=ProductLifecycleUpdate(lifecycle_state=LifecycleState.PUBLISHED),
    )
    prod_restored = await prod_svc.update_sold_out_state(
        product_id=prod.id,
        data=ProductSoldOutUpdate(manual_sold_out=False),
    )
    assert prod_restored.lifecycle_state == LifecycleState.PUBLISHED
    assert prod_restored.is_available is True

    # 13. Add product to custom section
    section = await sec_svc.create_section(
        SectionCreateRequest(
            title="Onam Festive Edit",
            subtitle="Exclusive Kasavu and Silk Collection",
            is_active=True,
            product_ids=[prod.id],
        )
    )
    assert len(section.items) == 1
    assert section.items[0].product_id == prod.id

    # 14. Remove product from custom section
    section_cleared = await sec_svc.reorder_section_items(
        section_id=section.id,
        req=SectionItemReorderRequest(items=[]),
    )
    assert len(section_cleared.items) == 0

    # Add back to test active toggle
    section_repopulated = await sec_svc.reorder_section_items(
        section_id=section.id,
        req=SectionItemReorderRequest(
            items=[SectionItemReorderItem(product_id=prod.id, sort_order=0)]
        ),
    )
    assert len(section_repopulated.items) == 1

    # 15. Activate / deactivate custom section
    section_inactive = await sec_svc.update_section(
        section_id=section.id,
        req=SectionUpdateRequest(is_active=False),
    )
    assert section_inactive.is_active is False

    # Public sections check: inactive section must NOT be returned to public
    public_sections = await sec_svc.list_public_sections()
    assert not any(s.id == section.id for s in public_sections)

    # Reactivate section
    section_active = await sec_svc.update_section(
        section_id=section.id,
        req=SectionUpdateRequest(is_active=True),
    )
    assert section_active.is_active is True

    # 16. Update shop status and emergency override
    from app.schemas.store import StoreOverrideRequest

    status = await store_svc.update_store_override(
        StoreOverrideRequest(
            override_mode=OverrideMode.FORCE_OPEN,
            override_banner="Store open special Sunday hours!",
        )
    )
    assert status.override_mode == OverrideMode.FORCE_OPEN
    assert status.override_banner == "Store open special Sunday hours!"

    # 17. Save product in anonymous wishlist session
    session_token = "test_anon_session_token_98765"
    sync_res = await saved_svc.sync_saved_items(
        SavedItemSyncRequest(
            session_token=session_token,
            product_ids=[prod.id],
        )
    )
    assert sync_res.total_saved == 1
    assert sync_res.items[0].id == prod.id

    # 18. Remove saved product from wishlist session
    sync_res_cleared = await saved_svc.sync_saved_items(
        SavedItemSyncRequest(
            session_token=session_token,
            product_ids=[],
        )
    )
    assert sync_res_cleared.total_saved == 0
