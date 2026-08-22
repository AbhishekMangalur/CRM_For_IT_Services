"""Approve deal registrations for won opportunities.

Revision ID: f6a0b2c4d5e7
Revises: e5f9a1b3c4d6
"""

from collections.abc import Sequence

from alembic import op


revision: str = "f6a0b2c4d5e7"
down_revision: str | Sequence[str] | None = "e5f9a1b3c4d6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE partner_deal_registrations AS registration
        SET registration_status = 'APPROVED'
        FROM opportunities AS opportunity
        WHERE registration.opportunity_id = opportunity.id
          AND registration.registration_status = 'PENDING'
          AND opportunity.pipeline_stage = 'CLOSED_WON'
          AND opportunity.status = 'WON'
        """
    )


def downgrade() -> None:
    pass
