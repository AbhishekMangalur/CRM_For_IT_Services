from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
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
    from backend.app.models.presale import Solution
    from app.models.sale import Opportunity
    from app.models.user import User


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    employee_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    designation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    department: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    total_experience_years: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    location: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    employment_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="FULL_TIME",
        server_default="FULL_TIME",
        index=True,
    )

    cost_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="USD",
        server_default="USD",
    )

    availability_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="AVAILABLE",
        server_default="AVAILABLE",
        index=True,
    )

    available_from: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    current_utilization_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
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

    employee_skills: Mapped[list["EmployeeSkill"]] = relationship(
        "EmployeeSkill",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    resource_allocations: Mapped[list["ResourceAllocation"]] = relationship(
        "ResourceAllocation",
        back_populates="employee",
        cascade="all, delete-orphan",
    )


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
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

    employee_skills: Mapped[list["EmployeeSkill"]] = relationship(
        "EmployeeSkill",
        back_populates="skill",
        cascade="all, delete-orphan",
    )


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "skill_id",
            name="uq_employee_skills_employee_skill",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
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

    skill_id: Mapped[int] = mapped_column(
        ForeignKey(
            "skills.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    proficiency_level: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    experience_years: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
        server_default="0",
    )

    certification_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    certification_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    certification_expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
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

    employee: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="employee_skills",
    )

    skill: Mapped["Skill"] = relationship(
        "Skill",
        back_populates="employee_skills",
    )


class ResourceRequest(Base):
    __tablename__ = "resource_requests"

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

    solution_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "solutions.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    requested_role: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    required_skill: Mapped[str] = mapped_column(
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

    required_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    required_until: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    allocation_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100,
        server_default="100",
    )

    location_type: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
        index=True,
    )

    request_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    requested_by: Mapped[int] = mapped_column(
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

    opportunity: Mapped["Opportunity"] = relationship(
        "Opportunity",
        back_populates="resource_requests",
    )

    solution: Mapped["Solution | None"] = relationship(
        "Solution",
        back_populates="resource_requests",
    )

    requester: Mapped["User"] = relationship(
        "User",
        foreign_keys=[requested_by],
    )

    resource_allocations: Mapped[list["ResourceAllocation"]] = relationship(
        "ResourceAllocation",
        back_populates="resource_request",
    )

    resource_requirement_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "resource_requirements.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        unique=True,
        index=True,
    )


class ResourceAllocation(Base):
    __tablename__ = "resource_allocations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
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

    opportunity_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "opportunities.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    solution_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "solutions.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    resource_request_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "resource_requests.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    allocation_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="SOFT_BOOKING",
        server_default="SOFT_BOOKING",
        index=True,
    )

    allocation_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100,
        server_default="100",
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )

    allocation_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )

    allocated_by: Mapped[int] = mapped_column(
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

    employee: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="resource_allocations",
    )

    opportunity: Mapped["Opportunity | None"] = relationship(
        "Opportunity",
        back_populates="resource_allocations",
    )

    solution: Mapped["Solution | None"] = relationship(
        "Solution",
        back_populates="resource_allocations",
    )

    resource_request: Mapped["ResourceRequest | None"] = relationship(
        "ResourceRequest",
        back_populates="resource_allocations",
    )

    allocator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[allocated_by],
    )
