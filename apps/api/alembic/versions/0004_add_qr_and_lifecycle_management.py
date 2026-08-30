"""0004_add_qr_and_lifecycle_management

Revision ID: 0004_add_qr_and_lifecycle_management
Revises: 0003_add_price_visibility
Create Date: 2026-08-30 08:00:00.000000

"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_add_qr_and_lifecycle_management"
down_revision: str | None = "0003_add_price_visibility"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Stores: add show_style_codes
    op.add_column(
        "stores",
        sa.Column(
            "show_style_codes",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )

    # 2. Products: add QR, operational status, damage/retirement flags, and timestamps
    op.add_column(
        "products",
        sa.Column("qr_code", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column(
            "qr_status",
            sa.String(length=20),
            nullable=False,
            server_default="ACTIVE",
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "operational_status",
            sa.String(length=20),
            nullable=False,
            server_default="AVAILABLE",
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "is_damaged",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "is_retired",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "products",
        sa.Column("sold_out_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("damaged_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("retired_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 3. Create product_lifecycle_logs table
    op.create_table(
        "product_lifecycle_logs",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.String(length=30), nullable=False),
        sa.Column("from_status", sa.String(length=50), nullable=True),
        sa.Column("to_status", sa.String(length=50), nullable=False),
        sa.Column("qr_code", sa.String(length=50), nullable=True),
        sa.Column("style_code", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name="fk_product_lifecycle_logs_product_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_product_lifecycle_logs"),
    )
    op.create_index(
        "idx_lifecycle_logs_product_created",
        "product_lifecycle_logs",
        ["product_id", "created_at"],
    )
    op.create_index(
        "idx_lifecycle_logs_event_type",
        "product_lifecycle_logs",
        ["event_type"],
    )

    # 4. Deterministic Backfill: assign unique qr_code & style_code for existing rows
    conn = op.get_bind()
    products_res = conn.execute(sa.text("SELECT id, style_code, name FROM products")).fetchall()
    for row in products_res:
        prod_id = row[0]
        curr_style = row[1]
        prod_name = row[2]

        # Ensure qr_code exists
        new_qr = f"KGY-QR-{uuid.uuid4().hex[:8].upper()}"

        # Ensure style_code exists
        if not curr_style:
            name_part = "".join(c for c in prod_name.upper() if c.isalnum())[:3].ljust(3, "X")
            curr_style = f"KGY-GEN-{name_part}-{uuid.uuid4().hex[:6].upper()}"

        conn.execute(
            sa.text(
                "UPDATE products SET qr_code = :qr, style_code = :style WHERE id = :id AND qr_code IS NULL"
            ),
            {"qr": new_qr, "style": curr_style, "id": prod_id},
        )

    # 5. Create unique constraints and indexes on products
    op.create_index(
        "idx_products_operational_status",
        "products",
        ["operational_status"],
    )
    op.create_index(
        "idx_products_qr_code",
        "products",
        ["qr_code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("idx_products_qr_code", table_name="products")
    op.drop_index("idx_products_operational_status", table_name="products")
    op.drop_table("product_lifecycle_logs")
    op.drop_column("products", "retired_at")
    op.drop_column("products", "damaged_at")
    op.drop_column("products", "sold_out_at")
    op.drop_column("products", "is_retired")
    op.drop_column("products", "is_damaged")
    op.drop_column("products", "operational_status")
    op.drop_column("products", "qr_status")
    op.drop_column("products", "qr_code")
    op.drop_column("stores", "show_style_codes")
