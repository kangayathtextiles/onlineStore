from datetime import time

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.seed import seed_master_data
from app.models.attribute import ColorOption, SizeOption
from app.models.custom_section import CustomSection, CustomSectionItem
from app.models.enums import DayOfWeek, LifecycleState, OverrideMode
from app.models.product import Product, ProductImage
from app.models.saved_item import SavedItem, SavedItemCollection
from app.models.store import OperatingSchedule, StoreProfile, StoreStatus
from app.models.taxonomy import Category, Subcategory
from app.models.variant import ProductVariant


@pytest.mark.asyncio
async def test_store_profile_and_schedule(db_session: AsyncSession) -> None:
    """Test StoreProfile and OperatingSchedule creation and cascade behavior."""
    store = StoreProfile(
        name="Kangayath Boutique",
        primary_phone="+919447000000",
        whatsapp_number="919447000000",
        address_line1="Main Junction",
        locality="Town Centre",
        panchayat="Kangayath",
        district="Centre",
        state="Kerala",
        pincode="680001",
    )
    db_session.add(store)
    await db_session.flush()

    schedule = OperatingSchedule(
        store_id=store.id,
        day_of_week=DayOfWeek.MONDAY,
        is_closed=False,
        open_time=time(9, 30),
        close_time=time(20, 30),
    )
    db_session.add(schedule)
    await db_session.commit()

    # Query back
    result = await db_session.execute(select(StoreProfile).where(StoreProfile.id == store.id))
    fetched_store = result.scalar_one()
    assert fetched_store.name == "Kangayath Boutique"
    assert len(fetched_store.schedules) == 1
    assert fetched_store.schedules[0].day_of_week == DayOfWeek.MONDAY


@pytest.mark.asyncio
async def test_category_and_subcategory_relationship(db_session: AsyncSession) -> None:
    """Test Category and Subcategory 2-level hierarchy."""
    category = Category(name="Men", slug="men", display_order=1)
    db_session.add(category)
    await db_session.flush()

    sub = Subcategory(
        category_id=category.id,
        name="Shirts",
        slug="men-shirts",
        display_order=1,
    )
    db_session.add(sub)
    await db_session.commit()

    res = await db_session.execute(select(Category).where(Category.slug == "men"))
    cat = res.scalar_one()
    assert len(cat.subcategories) == 1
    assert cat.subcategories[0].name == "Shirts"


@pytest.mark.asyncio
async def test_product_and_variant_matrix(db_session: AsyncSession) -> None:
    """Test Product creation, images, variants, and independent availability."""
    category = Category(name="Women", slug="women")
    db_session.add(category)
    await db_session.flush()

    subcategory = Subcategory(category_id=category.id, name="Sarees", slug="women-sarees")
    size_m = SizeOption(name="M", display_order=1)
    size_l = SizeOption(name="L", display_order=2)
    color_red = ColorOption(name="Crimson Red", hex_code="#DC143C", display_order=1)
    color_navy = ColorOption(name="Navy Blue", hex_code="#000080", display_order=2)

    db_session.add_all([subcategory, size_m, size_l, color_red, color_navy])
    await db_session.flush()

    # Create Product
    product = Product(
        category_id=category.id,
        subcategory_id=subcategory.id,
        name="Festive Kanchipuram Silk Saree",
        slug="festive-kanchipuram-silk-saree",
        lifecycle_state=LifecycleState.PUBLISHED,
        manual_sold_out=False,
    )
    db_session.add(product)
    await db_session.flush()

    # Add images
    img1 = ProductImage(
        product_id=product.id,
        url="https://images.example.com/saree-1.webp",
        is_primary=True,
        display_order=0,
    )
    img2 = ProductImage(
        product_id=product.id,
        url="https://images.example.com/saree-2.webp",
        is_primary=False,
        display_order=1,
    )
    db_session.add_all([img1, img2])

    # Add variants (Size M / Red: Available, Size L / Red: Sold Out)
    v1 = ProductVariant(
        product_id=product.id,
        size_id=size_m.id,
        color_id=color_red.id,
        is_available=True,
    )
    v2 = ProductVariant(
        product_id=product.id,
        size_id=size_l.id,
        color_id=color_red.id,
        is_available=False,
    )
    db_session.add_all([v1, v2])
    await db_session.commit()

    # Query back and verify
    res = await db_session.execute(
        select(Product).where(Product.slug == "festive-kanchipuram-silk-saree")
    )
    fetched_prod = res.scalar_one()
    assert len(fetched_prod.images) == 2
    assert fetched_prod.images[0].is_primary is True
    assert len(fetched_prod.variants) == 2
    assert any(v.is_available is True for v in fetched_prod.variants)
    assert any(v.is_available is False for v in fetched_prod.variants)


@pytest.mark.asyncio
async def test_duplicate_variant_rejected(db_session: AsyncSession) -> None:
    """Verify that duplicate (product_id, size_id, color_id) variants raise an IntegrityError."""
    cat = Category(name="Kids", slug="kids")
    db_session.add(cat)
    await db_session.flush()

    sub = Subcategory(category_id=cat.id, name="Sets", slug="kids-sets")
    size = SizeOption(name="28", display_order=1)
    color = ColorOption(name="Yellow", hex_code="#FFFF00", display_order=1)
    db_session.add_all([sub, size, color])
    await db_session.flush()

    product = Product(
        category_id=cat.id,
        subcategory_id=sub.id,
        name="Kids Festive Set",
        slug="kids-festive-set",
    )
    db_session.add(product)
    await db_session.flush()

    v1 = ProductVariant(product_id=product.id, size_id=size.id, color_id=color.id)
    v2 = ProductVariant(product_id=product.id, size_id=size.id, color_id=color.id)
    db_session.add(v1)
    await db_session.flush()

    db_session.add(v2)
    with pytest.raises(IntegrityError):
        await db_session.flush()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_custom_section_curation(db_session: AsyncSession) -> None:
    """Test CustomSection and CustomSectionItem association and ordering."""
    cat = Category(name="Ethnic", slug="ethnic")
    db_session.add(cat)
    await db_session.flush()
    sub = Subcategory(category_id=cat.id, name="Kurtas", slug="ethnic-kurtas")
    db_session.add(sub)
    await db_session.flush()

    p1 = Product(category_id=cat.id, subcategory_id=sub.id, name="Kurta A", slug="kurta-a")
    p2 = Product(category_id=cat.id, subcategory_id=sub.id, name="Kurta B", slug="kurta-b")
    db_session.add_all([p1, p2])
    await db_session.flush()

    section = CustomSection(title="Onam Specials", slug="onam-specials", display_order=1)
    db_session.add(section)
    await db_session.flush()

    item1 = CustomSectionItem(section_id=section.id, product_id=p1.id, sort_order=1)
    item2 = CustomSectionItem(section_id=section.id, product_id=p2.id, sort_order=2)
    db_session.add_all([item1, item2])
    await db_session.commit()

    res = await db_session.execute(
        select(CustomSection).where(CustomSection.slug == "onam-specials")
    )
    sec = res.scalar_one()
    assert len(sec.items) == 2
    assert sec.items[0].product_id == p1.id
    assert sec.items[1].product_id == p2.id


@pytest.mark.asyncio
async def test_saved_item_collection(db_session: AsyncSession) -> None:
    """Test SavedItemCollection and SavedItem with anonymous session token."""
    cat = Category(name="Casual", slug="casual")
    db_session.add(cat)
    await db_session.flush()
    sub = Subcategory(category_id=cat.id, name="Tees", slug="casual-tees")
    db_session.add(sub)
    await db_session.flush()

    p = Product(category_id=cat.id, subcategory_id=sub.id, name="T-Shirt", slug="t-shirt")
    db_session.add(p)
    await db_session.flush()

    collection = SavedItemCollection(session_token="anon_session_token_xyz_123")
    db_session.add(collection)
    await db_session.flush()

    saved_entry = SavedItem(collection_id=collection.id, product_id=p.id)
    db_session.add(saved_entry)
    await db_session.commit()

    res = await db_session.execute(
        select(SavedItemCollection).where(
            SavedItemCollection.session_token == "anon_session_token_xyz_123"
        )
    )
    fetched_col = res.scalar_one()
    assert len(fetched_col.items) == 1
    assert fetched_col.items[0].product_id == p.id


@pytest.mark.asyncio
async def test_seed_master_data_execution(db_session: AsyncSession) -> None:
    """Test that seed_master_data populates standard sizes, colors, and store status."""
    await seed_master_data(db_session)

    sizes = (await db_session.execute(select(SizeOption))).scalars().all()
    colors = (await db_session.execute(select(ColorOption))).scalars().all()
    status = (await db_session.execute(select(StoreStatus))).scalar_one()

    assert len(sizes) >= 16
    assert len(colors) >= 10
    assert status.override_mode == OverrideMode.AUTO
