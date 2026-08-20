from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class RFP(Base):
    __tablename__ = "rfps"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    rfp_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    opportunity_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "opportunities.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    client_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    industry: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    service_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    estimated_value: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    received_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    submission_deadline: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    rfp_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="RECEIVED",
        server_default="RECEIVED",
        index=True,
    )

    bid_decision: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    source: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
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

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    owner: Mapped["User"] = relationship(
        "User",
        foreign_keys=[owner_id],
    )

    evaluations: Mapped[list["BidEvaluation"]] = relationship(
        "BidEvaluation",
        back_populates="rfp",
        cascade="all, delete-orphan",
    )

    assignments: Mapped[list["RFPAssignment"]] = relationship(
        "RFPAssignment",
        back_populates="rfp",
        cascade="all, delete-orphan",
    )


class BidEvaluation(Base):
    __tablename__ = "bid_evaluations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    rfp_id: Mapped[int] = mapped_column(
        ForeignKey(
            "rfps.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    strategic_fit_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    technical_fit_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    resource_availability_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    profitability_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    win_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    overall_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    recommendation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    evaluated_by: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    rfp: Mapped["RFP"] = relationship(
        "RFP",
        back_populates="evaluations",
    )

    evaluator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[evaluated_by],
    )


class RFPAssignment(Base):
    __tablename__ = "rfp_assignments"

    __table_args__ = (
        UniqueConstraint(
            "rfp_id",
            "user_id",
            name="uq_rfp_assignment_user",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    rfp_id: Mapped[int] = mapped_column(
        ForeignKey(
            "rfps.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    assignment_role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    assignment_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ASSIGNED",
        server_default="ASSIGNED",
        index=True,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    rfp: Mapped["RFP"] = relationship(
        "RFP",
        back_populates="assignments",
    )

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )
