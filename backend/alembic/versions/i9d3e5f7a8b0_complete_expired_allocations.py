"""Complete expired allocations and recalculate availability.

Revision ID: i9d3e5f7a8b0
Revises: h8c2d4e6f7a9
"""

from collections.abc import Sequence

from alembic import op


revision: str = "i9d3e5f7a8b0"
down_revision: str | Sequence[str] | None = "h8c2d4e6f7a9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE resource_allocations
        SET allocation_status = 'COMPLETED'
        WHERE allocation_status IN ('PENDING', 'CONFIRMED')
          AND end_date IS NOT NULL
          AND end_date < CURRENT_DATE
        """
    )
    op.execute(
        """
        UPDATE employees AS employee
        SET current_utilization_percentage = LEAST(100, COALESCE((
                SELECT SUM(allocation.allocation_percentage)
                FROM resource_allocations AS allocation
                WHERE allocation.employee_id = employee.id
                  AND allocation.allocation_status IN ('PENDING', 'CONFIRMED')
            ), 0)),
            availability_status = CASE
                WHEN COALESCE((
                    SELECT SUM(allocation.allocation_percentage)
                    FROM resource_allocations AS allocation
                    WHERE allocation.employee_id = employee.id
                      AND allocation.allocation_status IN ('PENDING', 'CONFIRMED')
                ), 0) >= 100 THEN 'ALLOCATED'
                WHEN COALESCE((
                    SELECT SUM(allocation.allocation_percentage)
                    FROM resource_allocations AS allocation
                    WHERE allocation.employee_id = employee.id
                      AND allocation.allocation_status IN ('PENDING', 'CONFIRMED')
                ), 0) > 0 THEN 'PARTIALLY_AVAILABLE'
                ELSE 'AVAILABLE'
            END,
            available_from = CASE
                WHEN COALESCE((
                    SELECT SUM(allocation.allocation_percentage)
                    FROM resource_allocations AS allocation
                    WHERE allocation.employee_id = employee.id
                      AND allocation.allocation_status IN ('PENDING', 'CONFIRMED')
                ), 0) < 100 THEN CURRENT_DATE
                ELSE employee.available_from
            END
        """
    )
    op.execute(
        """
        UPDATE resource_requests AS request
        SET request_status = 'PENDING'
        WHERE request.request_status = 'ALLOCATED'
          AND NOT EXISTS (
              SELECT 1
              FROM resource_allocations AS allocation
              WHERE allocation.resource_request_id = request.id
                AND allocation.allocation_status IN ('PENDING', 'CONFIRMED')
          )
        """
    )
    op.execute(
        """
        UPDATE resource_requirements AS requirement
        SET availability_status = 'PENDING'
        FROM resource_requests AS request
        WHERE request.resource_requirement_id = requirement.id
          AND request.request_status = 'PENDING'
          AND requirement.availability_status = 'ALLOCATED'
        """
    )


def downgrade() -> None:
    pass
