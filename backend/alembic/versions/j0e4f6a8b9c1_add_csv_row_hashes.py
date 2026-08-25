"""Add hashes used to skip unchanged CSV rows.

Revision ID: j0e4f6a8b9c1
Revises: i9d3e5f7a8b0
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "j0e4f6a8b9c1"
down_revision: str | Sequence[str] | None = "i9d3e5f7a8b0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Existing rows intentionally start with NULL. Their hash is backfilled the
    # next time that business record appears in an uploaded CSV.
    op.add_column("employees", sa.Column("row_hash", sa.String(64), nullable=True))
    op.add_column(
        "customer_health_records",
        sa.Column("row_hash", sa.String(64), nullable=True),
    )
    op.add_column(
        "financial_actuals",
        sa.Column("row_hash", sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("financial_actuals", "row_hash")
    op.drop_column("customer_health_records", "row_hash")
    op.drop_column("employees", "row_hash")
