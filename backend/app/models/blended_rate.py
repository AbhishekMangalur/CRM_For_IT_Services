from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.presale import Estimation


class BlendedRate(Base):
    __tablename__ = "blended_rates"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    estimation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "estimations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    location_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    resource_ratio: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    bill_rate: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    cost_rate: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    estimation: Mapped["Estimation"] = relationship(
        "Estimation",
    )