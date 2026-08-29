"""0003_add_price_visibility

Revision ID: 0003_add_price_visibility
Revises: 0002_add_stored_media_table
Create Date: 2026-08-29 10:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_add_price_visibility"
down_revision: str | None = "0002_add_stored_media_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- Products table: add price and show_price ---
    op.add_column(
        "products",
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column(
            "show_price",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )

    # --- Categories table: add show_prices ---
    op.add_column(
        "categories",
        sa.Column(
            "show_prices",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )

    # --- Stores table: add show_prices (global master switch) ---
    op.add_column(
        "stores",
        sa.Column(
            "show_prices",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )


def downgrade() -> None:
    op.drop_column("stores", "show_prices")
    op.drop_column("categories", "show_prices")
    op.drop_column("products", "show_price")
    op.drop_column("products", "price")
