from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
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
    from app.models.resource_manager import Employee
    from app.models.sale import Opportunity
    from app.models.user import User


class Partner(Base):
    __tablename__ = "partners"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    partner_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    partner_program: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    partner_tier: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    contact_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
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

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
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

    deal_registrations: Mapped[list["PartnerDealRegistration"]] = relationship(
        "PartnerDealRegistration",
        back_populates="partner",
        cascade="all, delete-orphan",
    )

    influenced_opportunities: Mapped[list["PartnerInfluencedOpportunity"]] = relationship(
        "PartnerInfluencedOpportunity",
        back_populates="partner",
        cascade="all, delete-orphan",
    )

    certifications: Mapped[list["PartnerCertification"]] = relationship(
        "PartnerCertification",
        back_populates="partner",
        cascade="all, delete-orphan",
    )


class PartnerDealRegistration(Base):
    __tablename__ = "partner_deal_registrations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    partner_id: Mapped[int] = mapped_column(
        ForeignKey(
            "partners.id",
            ondelete="CASCADE",
        ),
        nullable=False,
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

    registration_reference: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        unique=True,
        index=True,
    )

    registration_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    registered_on: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    expected_incentive: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    registered_by: Mapped[int] = mapped_column(
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

    partner: Mapped["Partner"] = relationship(
        "Partner",
        back_populates="deal_registrations",
    )

    opportunity: Mapped["Opportunity"] = relationship(
        "Opportunity",
    )

    registrar: Mapped["User"] = relationship(
        "User",
        foreign_keys=[registered_by],
    )


class PartnerInfluencedOpportunity(Base):
    __tablename__ = "partner_influenced_opportunities"

    __table_args__ = (
        UniqueConstraint(
            "partner_id",
            "opportunity_id",
            name="uq_partner_influenced_opportunity",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    partner_id: Mapped[int] = mapped_column(
        ForeignKey(
            "partners.id",
            ondelete="CASCADE",
        ),
        nullable=False,
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

    influence_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    influenced_value: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    referral_fee: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    tier_points: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ACTIVE",
        server_default="ACTIVE",
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

    partner: Mapped["Partner"] = relationship(
        "Partner",
        back_populates="influenced_opportunities",
    )

    opportunity: Mapped["Opportunity"] = relationship(
        "Opportunity",
    )


class PartnerCertification(Base):
    __tablename__ = "partner_certifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    partner_id: Mapped[int] = mapped_column(
        ForeignKey(
            "partners.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey(
            "employees.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    certification_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    certification_level: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    certification_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    issued_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    verification_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
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

    partner: Mapped["Partner"] = relationship(
        "Partner",
        back_populates="certifications",
    )

    employee: Mapped["Employee"] = relationship(
        "Employee",
    )