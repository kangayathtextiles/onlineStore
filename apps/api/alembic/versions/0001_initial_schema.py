"""0001_initial_schema

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-08-20 15:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. stores
    op.create_table(
        "stores",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("tagline", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("primary_phone", sa.String(length=20), nullable=False),
        sa.Column("whatsapp_number", sa.String(length=20), nullable=False),
        sa.Column("address_line1", sa.String(length=200), nullable=False),
        sa.Column("address_line2", sa.String(length=200), nullable=True),
        sa.Column("locality", sa.String(length=100), nullable=False),
        sa.Column("panchayat", sa.String(length=100), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("pincode", sa.String(length=10), nullable=False),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("google_maps_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stores")),
    )

    # 2. operating_schedules
    op.create_table(
        "operating_schedules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("store_id", sa.Uuid(), nullable=False),
        sa.Column(
            "day_of_week",
            sa.Enum(
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                "SUNDAY",
                name="dayofweek",
                native_enum=False,
                length=10,
            ),
            nullable=False,
        ),
        sa.Column("is_closed", sa.Boolean(), nullable=False),
        sa.Column("open_time", sa.Time(), nullable=True),
        sa.Column("close_time", sa.Time(), nullable=True),
        sa.ForeignKeyConstraint(
            ["store_id"],
            ["stores.id"],
            name=op.f("fk_operating_schedules_store_id_stores"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_operating_schedules")),
        sa.UniqueConstraint("store_id", "day_of_week", name="uq_operating_schedule_store_day"),
    )

    # 3. store_statuses
    op.create_table(
        "store_statuses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "override_mode",
            sa.Enum(
                "AUTO",
                "FORCE_OPEN",
                "FORCE_CLOSED",
                name="overridemode",
                native_enum=False,
                length=20,
            ),
            nullable=False,
        ),
        sa.Column("override_banner", sa.String(length=255), nullable=True),
        sa.Column("override_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_store_statuses")),
    )

    # 4. categories
    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_categories")),
        sa.UniqueConstraint("slug", name=op.f("uq_categories_slug")),
    )
    op.create_index(op.f("ix_categories_slug"), "categories", ["slug"], unique=True)

    # 5. subcategories
    op.create_table(
        "subcategories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            name=op.f("fk_subcategories_category_id_categories"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subcategories")),
        sa.UniqueConstraint("category_id", "name", name="uq_subcategories_category_name"),
        sa.UniqueConstraint("slug", name=op.f("uq_subcategories_slug")),
    )
    op.create_index(
        op.f("ix_subcategories_category_id"), "subcategories", ["category_id"], unique=False
    )
    op.create_index(op.f("ix_subcategories_slug"), "subcategories", ["slug"], unique=True)

    # 6. size_options
    op.create_table(
        "size_options",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_size_options")),
        sa.UniqueConstraint("name", name=op.f("uq_size_options_name")),
    )
    op.create_index(op.f("ix_size_options_name"), "size_options", ["name"], unique=True)

    # 7. color_options
    op.create_table(
        "color_options",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("hex_code", sa.String(length=7), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_color_options")),
        sa.UniqueConstraint("name", name=op.f("uq_color_options_name")),
    )
    op.create_index(op.f("ix_color_options_name"), "color_options", ["name"], unique=True)

    # 8. products
    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("subcategory_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("material", sa.String(length=100), nullable=True),
        sa.Column("style_code", sa.String(length=50), nullable=True),
        sa.Column(
            "lifecycle_state",
            sa.Enum(
                "DRAFT",
                "PUBLISHED",
                "HIDDEN",
                "ARCHIVED",
                name="lifecyclestate",
                native_enum=False,
                length=20,
            ),
            nullable=False,
        ),
        sa.Column("manual_sold_out", sa.Boolean(), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.Column("meta_title", sa.String(length=100), nullable=True),
        sa.Column("meta_description", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            name=op.f("fk_products_category_id_categories"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["subcategory_id"],
            ["subcategories.id"],
            name=op.f("fk_products_subcategory_id_subcategories"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
        sa.UniqueConstraint("slug", name=op.f("uq_products_slug")),
    )
    op.create_index(
        "idx_products_lifecycle_cat",
        "products",
        ["lifecycle_state", "category_id", "subcategory_id"],
        unique=False,
    )
    op.create_index("idx_products_search_name", "products", ["name"], unique=False)
    op.create_index(op.f("ix_products_category_id"), "products", ["category_id"], unique=False)
    op.create_index(
        op.f("ix_products_lifecycle_state"), "products", ["lifecycle_state"], unique=False
    )
    op.create_index(op.f("ix_products_slug"), "products", ["slug"], unique=True)
    op.create_index(op.f("ix_products_style_code"), "products", ["style_code"], unique=False)
    op.create_index(
        op.f("ix_products_subcategory_id"), "products", ["subcategory_id"], unique=False
    )

    # 9. product_images
    op.create_table(
        "product_images",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("alt_text", sa.String(length=150), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_images_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_images")),
    )
    op.create_index(
        op.f("ix_product_images_product_id"), "product_images", ["product_id"], unique=False
    )

    # 10. product_variants
    op.create_table(
        "product_variants",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("size_id", sa.Uuid(), nullable=True),
        sa.Column("color_id", sa.Uuid(), nullable=True),
        sa.Column("sku", sa.String(length=60), nullable=True),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["color_id"],
            ["color_options.id"],
            name=op.f("fk_product_variants_color_id_color_options"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_product_variants_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["size_id"],
            ["size_options.id"],
            name=op.f("fk_product_variants_size_id_size_options"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_variants")),
        sa.UniqueConstraint(
            "product_id", "size_id", "color_id", name="uq_product_variants_combination"
        ),
    )
    op.create_index(
        "idx_product_variants_prod_avail",
        "product_variants",
        ["product_id", "is_available"],
        unique=False,
    )
    op.create_index(
        op.f("ix_product_variants_color_id"), "product_variants", ["color_id"], unique=False
    )
    op.create_index(
        op.f("ix_product_variants_product_id"), "product_variants", ["product_id"], unique=False
    )
    op.create_index(
        op.f("ix_product_variants_size_id"), "product_variants", ["size_id"], unique=False
    )

    # 11. custom_sections
    op.create_table(
        "custom_sections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("subtitle", sa.String(length=200), nullable=True),
        sa.Column("banner_image_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_custom_sections")),
        sa.UniqueConstraint("slug", name=op.f("uq_custom_sections_slug")),
    )
    op.create_index(op.f("ix_custom_sections_slug"), "custom_sections", ["slug"], unique=True)

    # 12. custom_section_items
    op.create_table(
        "custom_section_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("section_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_custom_section_items_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["section_id"],
            ["custom_sections.id"],
            name=op.f("fk_custom_section_items_section_id_custom_sections"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_custom_section_items")),
        sa.UniqueConstraint(
            "section_id", "product_id", name="uq_custom_section_items_section_product"
        ),
    )
    op.create_index(
        "idx_custom_section_items_order",
        "custom_section_items",
        ["section_id", "sort_order"],
        unique=False,
    )
    op.create_index(
        op.f("ix_custom_section_items_product_id"),
        "custom_section_items",
        ["product_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_custom_section_items_section_id"),
        "custom_section_items",
        ["section_id"],
        unique=False,
    )

    # 13. saved_item_collections
    op.create_table(
        "saved_item_collections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("session_token", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_saved_item_collections")),
        sa.UniqueConstraint("session_token", name=op.f("uq_saved_item_collections_session_token")),
    )
    op.create_index(
        op.f("ix_saved_item_collections_session_token"),
        "saved_item_collections",
        ["session_token"],
        unique=True,
    )

    # 14. saved_items
    op.create_table(
        "saved_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("collection_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["collection_id"],
            ["saved_item_collections.id"],
            name=op.f("fk_saved_items_collection_id_saved_item_collections"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_saved_items_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_saved_items")),
        sa.UniqueConstraint(
            "collection_id", "product_id", name="uq_saved_items_collection_product"
        ),
    )
    op.create_index(
        op.f("ix_saved_items_collection_id"), "saved_items", ["collection_id"], unique=False
    )
    op.create_index(op.f("ix_saved_items_product_id"), "saved_items", ["product_id"], unique=False)


def downgrade() -> None:
    op.drop_table("saved_items")
    op.drop_table("saved_item_collections")
    op.drop_table("custom_section_items")
    op.drop_table("custom_sections")
    op.drop_table("product_variants")
    op.drop_table("product_images")
    op.drop_table("products")
    op.drop_table("color_options")
    op.drop_table("size_options")
    op.drop_table("subcategories")
    op.drop_table("categories")
    op.drop_table("store_statuses")
    op.drop_table("operating_schedules")
    op.drop_table("stores")
