from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    Integer,
    Numeric,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ExecutiveKPISnapshot(Base):
    __tablename__ = "executive_kpi_snapshots"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    snapshot_month: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        unique=True,
        index=True,
    )

    total_pipeline_value: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    forecast_revenue: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    actual_revenue: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    gross_margin_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    win_rate: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    resource_utilization_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    bench_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    account_expansion_revenue: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    partner_influenced_pipeline: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    active_opportunities: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    won_opportunities: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    lost_opportunities: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    healthy_accounts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    at_risk_accounts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    active_contracts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    contracts_due_for_renewal: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    total_employees: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    available_employees: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    allocated_employees: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    pending_resource_requests: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    pending_presales_approvals: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )