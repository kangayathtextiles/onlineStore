"""0002_add_stored_media_table

Revision ID: 0002_add_stored_media_table
Revises: 0001_initial_schema
Create Date: 2026-08-23 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_add_stored_media_table"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "stored_media",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="products"),
        sa.Column(
            "content_type", sa.String(length=100), nullable=False, server_default="image/jpeg"
        ),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stored_media")),
    )
    op.create_index(op.f("ix_stored_media_filename"), "stored_media", ["filename"], unique=False)
    op.create_index(
        "idx_stored_media_cat_filename",
        "stored_media",
        ["category", "filename"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("idx_stored_media_cat_filename", table_name="stored_media")
    op.drop_index(op.f("ix_stored_media_filename"), table_name="stored_media")
    op.drop_table("stored_media")
