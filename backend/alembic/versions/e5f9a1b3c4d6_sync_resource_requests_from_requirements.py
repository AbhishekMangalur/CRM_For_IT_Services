"""Synchronize resource requests from Presales requirements.

Revision ID: e5f9a1b3c4d6
Revises: d4e8f0a2b3c5
"""

from collections.abc import Sequence

from alembic import op


revision: str = "e5f9a1b3c4d6"
down_revision: str | Sequence[str] | None = "d4e8f0a2b3c5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE resource_requests AS request
        SET opportunity_id = solution.opportunity_id,
            solution_id = requirement.solution_id,
            requested_role = requirement.role_name,
            required_skill = requirement.skill_name,
            experience_level = requirement.experience_level,
            minimum_experience_years = requirement.minimum_experience_years,
            quantity = requirement.quantity,
            required_until = CASE
                WHEN requirement.duration_months IS NULL THEN NULL
                ELSE (
                    request.required_from
                    + requirement.duration_months::integer * INTERVAL '1 month'
                )::date
            END,
            allocation_percentage = requirement.allocation_percentage,
            location_type = requirement.location_type
        FROM resource_requirements AS requirement
        JOIN solutions AS solution
          ON solution.id = requirement.solution_id
        WHERE request.resource_requirement_id = requirement.id
        """
    )


def downgrade() -> None:
    pass
