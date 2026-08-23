import asyncio
import logging
from datetime import time
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker
from app.models.attribute import ColorOption, SizeOption
from app.models.custom_section import CustomSection
from app.models.enums import DayOfWeek, OverrideMode
from app.models.store import OperatingSchedule, StoreProfile, StoreStatus
from app.models.taxonomy import Category, Subcategory

logger = logging.getLogger("kangayath.db.seed")

# Master Reference Data: Clothing Sizes
MASTER_SIZES: list[dict[str, Any]] = [
    {"name": "XS", "display_order": 1},
    {"name": "S", "display_order": 2},
    {"name": "M", "display_order": 3},
    {"name": "L", "display_order": 4},
    {"name": "XL", "display_order": 5},
    {"name": "XXL", "display_order": 6},
    {"name": "3XL", "display_order": 7},
    {"name": "Free Size", "display_order": 8},
    {"name": "28", "display_order": 9},
    {"name": "30", "display_order": 10},
    {"name": "32", "display_order": 11},
    {"name": "34", "display_order": 12},
    {"name": "36", "display_order": 13},
    {"name": "38", "display_order": 14},
    {"name": "40", "display_order": 15},
    {"name": "42", "display_order": 16},
]

# Master Reference Data: Brand & Garment Colors
MASTER_COLORS: list[dict[str, Any]] = [
    {"name": "Maroon", "hex_code": "#651714", "display_order": 1},
    {"name": "Heritage Brown", "hex_code": "#2A0D0B", "display_order": 2},
    {"name": "Navy Blue", "hex_code": "#000080", "display_order": 3},
    {"name": "Forest Green", "hex_code": "#228B22", "display_order": 4},
    {"name": "Mustard Gold", "hex_code": "#DAA520", "display_order": 5},
    {"name": "Off White / Cream", "hex_code": "#F0EFED", "display_order": 6},
    {"name": "Pure Black", "hex_code": "#000000", "display_order": 7},
    {"name": "Royal Blue", "hex_code": "#4169E1", "display_order": 8},
    {"name": "Crimson Red", "hex_code": "#DC143C", "display_order": 9},
    {"name": "Olive Green", "hex_code": "#333323", "display_order": 10},
]


async def seed_master_data(session: AsyncSession) -> None:
    """Seed master reference data (sizes, colors)."""
    # 1. Sizes
    for size_data in MASTER_SIZES:
        res = await session.execute(select(SizeOption).where(SizeOption.name == size_data["name"]))
        if not res.scalar_one_or_none():
            session.add(SizeOption(**size_data))

    # 2. Colors
    for color_data in MASTER_COLORS:
        res = await session.execute(
            select(ColorOption).where(ColorOption.name == color_data["name"])
        )
        if not res.scalar_one_or_none():
            session.add(ColorOption(**color_data))

    # 3. Store Status Singleton
    status_res = await session.execute(select(StoreStatus))
    if not status_res.scalar_one_or_none():
        session.add(StoreStatus(override_mode=OverrideMode.AUTO))

    await session.commit()
    logger.info("Master reference data seeded successfully.")


async def seed_development_data(session: AsyncSession) -> None:
    """Seed initial store profile, schedules, and sample categories for development."""
    # 1. Store Profile
    store_res = await session.execute(select(StoreProfile))
    store = store_res.scalar_one_or_none()
    if not store:
        store = StoreProfile(
            name="Kangayath Clothing & Textiles",
            tagline="Quality Everyday & Festive Garments",
            description="Leading clothing store in the panchayat specializing in traditional sarees, dhotis, daily wear, and festive collections.",
            primary_phone="+91 94470 00000",
            whatsapp_number="919447000000",
            address_line1="Main Road, Near Panchayat Junction",
            locality="Kangayath Town",
            panchayat="Kangayath Grama Panchayat",
            district="District Centre",
            state="Kerala",
            pincode="680001",
            google_maps_url="https://maps.google.com/?q=10.0000,76.0000",
        )
        session.add(store)
        await session.flush()

        # Weekly Schedule
        days = [
            (DayOfWeek.MONDAY, False, time(9, 30), time(20, 30)),
            (DayOfWeek.TUESDAY, False, time(9, 30), time(20, 30)),
            (DayOfWeek.WEDNESDAY, False, time(9, 30), time(20, 30)),
            (DayOfWeek.THURSDAY, False, time(9, 30), time(20, 30)),
            (DayOfWeek.FRIDAY, False, time(9, 30), time(20, 30)),
            (DayOfWeek.SATURDAY, False, time(9, 30), time(21, 0)),
            (DayOfWeek.SUNDAY, True, None, None),
        ]
        for day, is_closed, open_t, close_t in days:
            session.add(
                OperatingSchedule(
                    store_id=store.id,
                    day_of_week=day,
                    is_closed=is_closed,
                    open_time=open_t,
                    close_time=close_t,
                )
            )

    # 2. Sample Categories & Subcategories
    sample_categories: list[dict[str, Any]] = [
        {
            "name": "Men",
            "slug": "men",
            "description": "Men's traditional and casual wear",
            "display_order": 1,
            "subcategories": [
                {"name": "Casual Shirts", "slug": "men-casual-shirts", "display_order": 1},
                {"name": "Formal Shirts", "slug": "men-formal-shirts", "display_order": 2},
                {"name": "Traditional Dhotis", "slug": "men-dhotis", "display_order": 3},
            ],
        },
        {
            "name": "Women",
            "slug": "women",
            "description": "Women's sarees, kurtis, and ethnic garments",
            "display_order": 2,
            "subcategories": [
                {"name": "Silk Sarees", "slug": "women-silk-sarees", "display_order": 1},
                {"name": "Cotton Sarees", "slug": "women-cotton-sarees", "display_order": 2},
                {"name": "Kurtis & Sets", "slug": "women-kurtis", "display_order": 3},
            ],
        },
        {
            "name": "Kids",
            "slug": "kids",
            "description": "Boys and girls festive and daily wear",
            "display_order": 3,
            "subcategories": [
                {"name": "Boys Wear", "slug": "kids-boys-wear", "display_order": 1},
                {"name": "Girls Wear", "slug": "kids-girls-wear", "display_order": 2},
            ],
        },
    ]

    for cat_data in sample_categories:
        cat_res = await session.execute(select(Category).where(Category.slug == cat_data["slug"]))
        if not cat_res.scalar_one_or_none():
            cat = Category(
                name=str(cat_data["name"]),
                slug=str(cat_data["slug"]),
                description=str(cat_data["description"]),
                display_order=int(cat_data["display_order"]),
            )
            session.add(cat)
            await session.flush()

            subcategories: list[dict[str, Any]] = cat_data.get("subcategories", [])
            for sub_data in subcategories:
                session.add(
                    Subcategory(
                        category_id=cat.id,
                        name=str(sub_data["name"]),
                        slug=str(sub_data["slug"]),
                        display_order=int(sub_data["display_order"]),
                    )
                )

    # 3. Sample Promotional Section
    sec_res = await session.execute(
        select(CustomSection).where(CustomSection.slug == "onam-special-offers")
    )
    if not sec_res.scalar_one_or_none():
        session.add(
            CustomSection(
                title="Onam Festive Special Offers",
                slug="onam-special-offers",
                subtitle="Exclusive festive handloom sarees, kasavu dhotis & kids sets",
                display_order=1,
            )
        )

    await session.commit()
    logger.info("Development demo data seeded successfully.")


async def backfill_media_assets(session: AsyncSession) -> None:
    """
    Scans physical disk media directories and ensures all existing media files
    are persisted into PostgreSQL StoredMedia table for zero-loss recovery.
    """
    import mimetypes
    import os

    from app.core.config import settings
    from app.models.stored_media import StoredMedia

    media_root = settings.RESOLVED_MEDIA_ROOT
    if not os.path.exists(media_root):
        return

    count = 0
    for category in ["products", "uploads"]:
        cat_dir = os.path.join(media_root, category)
        if not os.path.exists(cat_dir):
            continue

        for fname in os.listdir(cat_dir):
            file_path = os.path.join(cat_dir, fname)
            if not os.path.isfile(file_path):
                continue

            # Check if already present in database
            stmt = select(StoredMedia).where(
                StoredMedia.filename == fname, StoredMedia.category == category
            )
            res = await session.execute(stmt)
            if res.scalar_one_or_none() is None:
                try:
                    with open(file_path, "rb") as f:
                        data = f.read()
                    content_type, _ = mimetypes.guess_type(fname)
                    session.add(
                        StoredMedia(
                            filename=fname,
                            category=category,
                            content_type=content_type or "image/jpeg",
                            data=data,
                            size_bytes=len(data),
                        )
                    )
                    count += 1
                except Exception as e:
                    logger.warning("Could not backfill media file %s: %s", fname, str(e))

    if count > 0:
        await session.commit()
        logger.info("Backfilled %d media assets into PostgreSQL StoredMedia.", count)


async def run_all_seeds() -> None:
    """Run all seed operations within a standalone session."""
    async with async_session_maker() as session:
        await seed_master_data(session)
        await seed_development_data(session)
        await backfill_media_assets(session)


if __name__ == "__main__":
    asyncio.run(run_all_seeds())
