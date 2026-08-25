from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


if TYPE_CHECKING:
    from app.models.account_director import Account, Contract
    from app.models.sale import Opportunity
    from app.models.presale import Estimation


class FinancialActual(Base):
    __tablename__ = "financial_actuals"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey(
            "opportunities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    account_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "accounts.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    contract_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "contracts.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    estimation_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "estimations.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    billing_milestone: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    milestone_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    actual_revenue: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    actual_cost: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    actual_profit: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    actual_margin_percentage: Mapped[Decimal] = mapped_column(
        Numeric(7, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    projected_margin_percentage: Mapped[Decimal | None] = mapped_column(
        Numeric(7, 2),
        nullable=True,
    )

    margin_variance: Mapped[Decimal | None] = mapped_column(
        Numeric(7, 2),
        nullable=True,
    )

    timesheet_utilization_percentage: Mapped[Decimal | None] = mapped_column(
        Numeric(7, 2),
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="INR",
        server_default="INR",
    )

    source_system: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="CSV_IMPORT",
        server_default="CSV_IMPORT",
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    row_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
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

    opportunity = relationship(
        "Opportunity",
    )

    account = relationship(
        "Account",
    )

    contract = relationship(
        "Contract",
    )

    estimation = relationship(
        "Estimation",
    )
