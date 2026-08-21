# defines the database models for account director related entities, including accounts, contracts, customer health records, and account opportunities
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
    from app.models.user import User


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    account_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    industry: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    primary_contact_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    primary_contact_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    primary_contact_phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    account_director_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    annual_revenue: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    customer_health_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="GREEN",
        server_default="GREEN",
        index=True,
    )

    nps_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    sla_status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
        index=True,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="LOW",
        server_default="LOW",
        index=True,
    )

    account_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ACTIVE",
        server_default="ACTIVE",
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

    account_director: Mapped["User"] = relationship(
        "User",
        foreign_keys=[account_director_id],
    )

    contracts: Mapped[list["Contract"]] = relationship(
        "Contract",
        back_populates="account",
        cascade="all, delete-orphan",
    )

    health_records: Mapped[list["CustomerHealthRecord"]] = relationship(
        "CustomerHealthRecord",
        back_populates="account",
        cascade="all, delete-orphan",
    )

    account_opportunities: Mapped[list["AccountOpportunity"]] = relationship(
        "AccountOpportunity",
        back_populates="account",
        cascade="all, delete-orphan",
    )


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    account_id: Mapped[int] = mapped_column(
        ForeignKey(
            "accounts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    contract_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    contract_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    contract_value: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    renewal_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    renewal_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="NOT_DUE",
        server_default="NOT_DUE",
        index=True,
    )

    contract_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ACTIVE",
        server_default="ACTIVE",
        index=True,
    )

    document_url: Mapped[str | None] = mapped_column(
        String(500),
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

    account: Mapped["Account"] = relationship(
        "Account",
        back_populates="contracts",
    )


class CustomerHealthRecord(Base):
    __tablename__ = "customer_health_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    account_id: Mapped[int] = mapped_column(
        ForeignKey(
            "accounts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    delivery_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    financial_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    customer_satisfaction_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    sla_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    overall_health_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
        index=True,
    )

    health_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="GREEN",
        server_default="GREEN",
        index=True,
    )

    risk_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    account: Mapped["Account"] = relationship(
        "Account",
        back_populates="health_records",
    )


class AccountOpportunity(Base):
    __tablename__ = "account_opportunities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    account_id: Mapped[int] = mapped_column(
        ForeignKey(
            "accounts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    opportunity_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    service_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    estimated_value: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    probability: Mapped[float] = mapped_column(
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

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="OPEN",
        server_default="OPEN",
        index=True,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
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

    account: Mapped["Account"] = relationship(
        "Account",
        back_populates="account_opportunities",
    )

    creator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by],
    )