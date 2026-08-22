"""Remove the RFP assignments feature.

Revision ID: c3d7e9f1a2b4
Revises: a8c1f4d2e6b9
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "c3d7e9f1a2b4"
down_revision: str | Sequence[str] | None = "a8c1f4d2e6b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_table("rfp_assignments")


def downgrade() -> None:
    op.create_table(
        "rfp_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rfp_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("assignment_role", sa.String(length=50), nullable=False),
        sa.Column(
            "assignment_status",
            sa.String(length=30),
            server_default="ASSIGNED",
            nullable=False,
        ),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["rfp_id"],
            ["rfps.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "rfp_id",
            "user_id",
            name="uq_rfp_assignment_user",
        ),
    )
    op.create_index(
        op.f("ix_rfp_assignments_assignment_role"),
        "rfp_assignments",
        ["assignment_role"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rfp_assignments_assignment_status"),
        "rfp_assignments",
        ["assignment_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rfp_assignments_id"),
        "rfp_assignments",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rfp_assignments_rfp_id"),
        "rfp_assignments",
        ["rfp_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rfp_assignments_user_id"),
        "rfp_assignments",
        ["user_id"],
        unique=False,
    )
