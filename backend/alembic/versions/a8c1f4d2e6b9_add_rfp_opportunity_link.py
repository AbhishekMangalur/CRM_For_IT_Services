"""add RFP opportunity link

Revision ID: a8c1f4d2e6b9
Revises: e19527351a4e
Create Date: 2026-08-21
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a8c1f4d2e6b9"
down_revision: Union[str, Sequence[str], None] = "e19527351a4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rfps",
        sa.Column("opportunity_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_rfps_opportunity_id_opportunities",
        "rfps",
        "opportunities",
        ["opportunity_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_rfps_opportunity_id",
        "rfps",
        ["opportunity_id"],
    )
    op.execute(
        """
        UPDATE rfps AS rfp
        SET opportunity_id = opportunity.id
        FROM opportunities AS opportunity
        WHERE rfp.opportunity_id IS NULL
          AND rfp.title = opportunity.opportunity_name
          AND rfp.client_name = opportunity.client_name
        """
    )


def downgrade() -> None:
    op.drop_index("ix_rfps_opportunity_id", table_name="rfps")
    op.drop_constraint(
        "fk_rfps_opportunity_id_opportunities",
        "rfps",
        type_="foreignkey",
    )
    op.drop_column("rfps", "opportunity_id")
