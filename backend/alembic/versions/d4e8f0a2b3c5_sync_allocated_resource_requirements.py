"""Synchronize allocated Presales resource requirements.

Revision ID: d4e8f0a2b3c5
Revises: c3d7e9f1a2b4
"""

from collections.abc import Sequence

from alembic import op


revision: str = "d4e8f0a2b3c5"
down_revision: str | Sequence[str] | None = "c3d7e9f1a2b4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE resource_requirements AS requirement
        SET availability_status = 'ALLOCATED'
        WHERE EXISTS (
            SELECT 1
            FROM resource_requests AS request
            JOIN resource_allocations AS allocation
              ON allocation.resource_request_id = request.id
            WHERE request.resource_requirement_id = requirement.id
              AND allocation.allocation_status IN ('PENDING', 'CONFIRMED')
        )
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE resource_requirements
        SET availability_status = 'PENDING'
        WHERE availability_status = 'ALLOCATED'
        """
    )
