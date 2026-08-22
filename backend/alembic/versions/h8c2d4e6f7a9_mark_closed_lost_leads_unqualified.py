"""Mark leads for closed-lost opportunities as unqualified.

Revision ID: h8c2d4e6f7a9
Revises: g7b1c3d5e6f8
"""

from collections.abc import Sequence

from alembic import op


revision: str = "h8c2d4e6f7a9"
down_revision: str | Sequence[str] | None = "g7b1c3d5e6f8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE leads AS lead
        SET lead_status = 'UNQUALIFIED'
        FROM opportunities AS opportunity
        WHERE opportunity.lead_id = lead.id
          AND opportunity.pipeline_stage = 'CLOSED_LOST'
          AND opportunity.status = 'LOST'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE leads AS lead
        SET lead_status = 'QUALIFIED'
        FROM opportunities AS opportunity
        WHERE opportunity.lead_id = lead.id
          AND opportunity.pipeline_stage = 'CLOSED_LOST'
          AND opportunity.status = 'LOST'
          AND lead.lead_status = 'UNQUALIFIED'
        """
    )
