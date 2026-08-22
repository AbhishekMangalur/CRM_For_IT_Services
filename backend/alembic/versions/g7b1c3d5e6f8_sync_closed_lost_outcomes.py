"""Synchronize dependencies for closed-lost opportunities.

Revision ID: g7b1c3d5e6f8
Revises: f6a0b2c4d5e7
"""

from collections.abc import Sequence

from alembic import op


revision: str = "g7b1c3d5e6f8"
down_revision: str | Sequence[str] | None = "f6a0b2c4d5e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE leads AS lead
        SET lead_status = 'QUALIFIED'
        FROM opportunities AS opportunity
        WHERE opportunity.lead_id = lead.id
          AND opportunity.pipeline_stage = 'CLOSED_LOST'
          AND opportunity.status = 'LOST'
        """
    )
    op.execute(
        """
        UPDATE resource_allocations AS allocation
        SET allocation_status = 'CANCELLED'
        WHERE allocation.allocation_status IN ('PENDING', 'CONFIRMED')
          AND EXISTS (
              SELECT 1
              FROM opportunities AS opportunity
              WHERE opportunity.pipeline_stage = 'CLOSED_LOST'
                AND opportunity.status = 'LOST'
                AND (
                    allocation.opportunity_id = opportunity.id
                    OR allocation.solution_id IN (
                        SELECT solution.id
                        FROM solutions AS solution
                        WHERE solution.opportunity_id = opportunity.id
                    )
                    OR allocation.resource_request_id IN (
                        SELECT request.id
                        FROM resource_requests AS request
                        WHERE request.opportunity_id = opportunity.id
                    )
                )
          )
        """
    )
    op.execute(
        """
        UPDATE employees AS employee
        SET current_utilization_percentage = COALESCE((
                SELECT SUM(allocation.allocation_percentage)
                FROM resource_allocations AS allocation
                WHERE allocation.employee_id = employee.id
                  AND allocation.allocation_status IN ('PENDING', 'CONFIRMED')
            ), 0),
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
    op.execute(
        """
        UPDATE rfps AS rfp
        SET rfp_status = 'LOST',
            completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
        FROM opportunities AS opportunity
        WHERE rfp.opportunity_id = opportunity.id
          AND opportunity.pipeline_stage = 'CLOSED_LOST'
          AND opportunity.status = 'LOST'
        """
    )
    op.execute(
        """
        UPDATE partner_deal_registrations AS registration
        SET registration_status = 'REJECTED'
        FROM opportunities AS opportunity
        WHERE registration.opportunity_id = opportunity.id
          AND registration.registration_status IN ('PENDING', 'APPROVED')
          AND opportunity.pipeline_stage = 'CLOSED_LOST'
          AND opportunity.status = 'LOST'
        """
    )


def downgrade() -> None:
    pass
