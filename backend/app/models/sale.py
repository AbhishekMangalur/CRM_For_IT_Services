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
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from backend.app.models.presale import Solution
    from app.models.resource_manager import (
        ResourceAllocation,
        ResourceRequest,
    )
    from app.models.user import User


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    contact_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    contact_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    contact_phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    designation: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    lead_source: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    lead_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="NEW",
        server_default="NEW",
        index=True,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="MEDIUM",
        server_default="MEDIUM",
        index=True,
    )

    estimated_value: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    assigned_sales_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    next_follow_up_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
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

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    assigned_sales: Mapped["User"] = relationship(
        "User",
        foreign_keys=[assigned_sales_id],
    )

    opportunities: Mapped[list["Opportunity"]] = relationship(
        "Opportunity",
        back_populates="lead",
    )

    activities: Mapped[list["SalesActivity"]] = relationship(
        "SalesActivity",
        back_populates="lead",
        cascade="all, delete-orphan",
    )


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    lead_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "leads.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    opportunity_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    client_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    service_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    industry: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    deal_value: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    pipeline_stage: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="PROSPECTING",
        server_default="PROSPECTING",
        index=True,
    )

    win_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    expected_close_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    expected_start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    sales_owner_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    presales_owner_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="OPEN",
        server_default="OPEN",
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
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

    lead: Mapped["Lead | None"] = relationship(
        "Lead",
        back_populates="opportunities",
    )

    sales_owner: Mapped["User"] = relationship(
        "User",
        foreign_keys=[sales_owner_id],
    )

    presales_owner: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[presales_owner_id],
    )

    activities: Mapped[list["SalesActivity"]] = relationship(
        "SalesActivity",
        back_populates="opportunity",
        cascade="all, delete-orphan",
    )

    solutions: Mapped[list["Solution"]] = relationship(
        "Solution",
        back_populates="opportunity",
        cascade="all, delete-orphan",
    )

    resource_requests: Mapped[list["ResourceRequest"]] = relationship(
        "ResourceRequest",
        back_populates="opportunity",
        cascade="all, delete-orphan",
    )

    resource_allocations: Mapped[list["ResourceAllocation"]] = relationship(
        "ResourceAllocation",
        back_populates="opportunity",
    )


class SalesActivity(Base):
    __tablename__ = "sales_activities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    lead_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "leads.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    opportunity_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "opportunities.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    activity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    subject: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    activity_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    next_follow_up_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PLANNED",
        server_default="PLANNED",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    lead: Mapped["Lead | None"] = relationship(
        "Lead",
        back_populates="activities",
    )

    opportunity: Mapped["Opportunity | None"] = relationship(
        "Opportunity",
        back_populates="activities",
    )

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
    )