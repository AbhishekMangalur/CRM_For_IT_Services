from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.resource_manager import (
        ResourceAllocation,
        ResourceRequest,
    )
    from app.models.sale import Opportunity
    from app.models.user import User


class Solution(Base):
    __tablename__ = "solutions"

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

    solution_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    solution_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    technology_stack: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    architecture_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    delivery_model: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="OFFSHORE",
        server_default="OFFSHORE",
        index=True,
    )

    estimated_duration_months: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    presales_owner_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    solution_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="DRAFT",
        server_default="DRAFT",
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

    opportunity: Mapped["Opportunity"] = relationship(
        "Opportunity",
        back_populates="solutions",
    )

    presales_owner: Mapped["User"] = relationship(
        "User",
        foreign_keys=[presales_owner_id],
    )

    estimation: Mapped["Estimation | None"] = relationship(
        "Estimation",
        back_populates="solution",
        cascade="all, delete-orphan",
        uselist=False,
    )

    resource_requirements: Mapped[list["ResourceRequirement"]] = relationship(
        "ResourceRequirement",
        back_populates="solution",
        cascade="all, delete-orphan",
    )

    proposals: Mapped[list["Proposal"]] = relationship(
        "Proposal",
        back_populates="solution",
        cascade="all, delete-orphan",
    )

    resource_requests: Mapped[list["ResourceRequest"]] = relationship(
        "ResourceRequest",
        back_populates="solution",
    )

    resource_allocations: Mapped[list["ResourceAllocation"]] = relationship(
        "ResourceAllocation",
        back_populates="solution",
    )


class Estimation(Base):
    __tablename__ = "estimations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    solution_id: Mapped[int] = mapped_column(
        ForeignKey(
            "solutions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    estimation_model: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    resource_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    infrastructure_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    overhead_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    contingency_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    contingency_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    total_delivery_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    billing_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    expected_profit: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    expected_margin_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    approval_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
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

    solution: Mapped["Solution"] = relationship(
        "Solution",
        back_populates="estimation",
    )

    approver: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[approved_by],
    )


class ResourceRequirement(Base):
    __tablename__ = "resource_requirements"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    solution_id: Mapped[int] = mapped_column(
        ForeignKey(
            "solutions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    role_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    skill_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    experience_level: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    minimum_experience_years: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    location_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="OFFSHORE",
        server_default="OFFSHORE",
        index=True,
    )

    duration_months: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    allocation_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100,
        server_default="100",
    )

    cost_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    billing_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    availability_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
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

    solution: Mapped["Solution"] = relationship(
        "Solution",
        back_populates="resource_requirements",
    )


class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    solution_id: Mapped[int] = mapped_column(
        ForeignKey(
            "solutions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    proposal_title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    version: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="1.0",
        server_default="1.0",
    )

    sow_document_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    proposal_document_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    sow_document_filename: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    sow_document_content: Mapped[bytes | None] = mapped_column(
        LargeBinary, nullable=True, deferred=True
    )
    proposal_document_filename: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    proposal_document_content: Mapped[bytes | None] = mapped_column(
        LargeBinary, nullable=True, deferred=True
    )

    submission_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    proposal_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="DRAFT",
        server_default="DRAFT",
        index=True,
    )

    approval_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    remarks: Mapped[str | None] = mapped_column(
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

    solution: Mapped["Solution"] = relationship(
        "Solution",
        back_populates="proposals",
    )
