from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# Solution schemas
# =========================================================


class SolutionCreate(BaseModel):
    opportunity_id: int = Field(gt=0)

    solution_name: str = Field(
        min_length=2,
        max_length=200,
    )

    solution_summary: str | None = None
    technology_stack: str | None = None
    architecture_notes: str | None = None

    delivery_model: str = Field(
        default="OFFSHORE",
        min_length=2,
        max_length=50,
    )

    estimated_duration_months: float | None = Field(
        default=None,
        gt=0,
    )

    presales_owner_id: int = Field(gt=0)

    solution_status: str = Field(
        default="DRAFT",
        min_length=2,
        max_length=50,
    )


class SolutionPut(BaseModel):
    opportunity_id: int = Field(gt=0)

    solution_name: str = Field(
        min_length=2,
        max_length=200,
    )

    solution_summary: str | None = None
    technology_stack: str | None = None
    architecture_notes: str | None = None

    delivery_model: str = Field(
        min_length=2,
        max_length=50,
    )

    estimated_duration_months: float | None = Field(
        default=None,
        gt=0,
    )

    presales_owner_id: int = Field(gt=0)

    solution_status: str = Field(
        min_length=2,
        max_length=50,
    )


class SolutionPatch(BaseModel):
    opportunity_id: int | None = Field(
        default=None,
        gt=0,
    )

    solution_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    solution_summary: str | None = None
    technology_stack: str | None = None
    architecture_notes: str | None = None

    delivery_model: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    estimated_duration_months: float | None = Field(
        default=None,
        gt=0,
    )

    presales_owner_id: int | None = Field(
        default=None,
        gt=0,
    )

    solution_status: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )


class SolutionResponse(BaseModel):
    id: int
    opportunity_id: int
    solution_name: str
    solution_summary: str | None
    technology_stack: str | None
    architecture_notes: str | None
    delivery_model: str
    estimated_duration_months: float | None
    presales_owner_id: int
    solution_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Estimation schemas
# =========================================================


class EstimationCreate(BaseModel):
    solution_id: int = Field(gt=0)

    estimation_model: str = Field(
        min_length=2,
        max_length=50,
    )

    resource_cost: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    infrastructure_cost: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    overhead_cost: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    contingency_percentage: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    billing_amount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(
        default="USD",
        min_length=3,
        max_length=10,
    )


class EstimationPut(BaseModel):
    solution_id: int = Field(gt=0)

    estimation_model: str = Field(
        min_length=2,
        max_length=50,
    )

    resource_cost: Decimal = Field(
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    infrastructure_cost: Decimal = Field(
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    overhead_cost: Decimal = Field(
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    contingency_percentage: float = Field(
        ge=0,
        le=100,
    )

    billing_amount: Decimal = Field(
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(
        min_length=3,
        max_length=10,
    )


class EstimationPatch(BaseModel):
    solution_id: int | None = Field(
        default=None,
        gt=0,
    )

    estimation_model: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    resource_cost: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    infrastructure_cost: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    overhead_cost: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    contingency_percentage: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    billing_amount: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] | None = Field(
        default=None,
        min_length=3,
        max_length=10,
    )


class EstimationResponse(BaseModel):
    id: int
    solution_id: int
    estimation_model: str
    resource_cost: Decimal
    infrastructure_cost: Decimal
    overhead_cost: Decimal
    contingency_percentage: float
    contingency_amount: Decimal
    total_delivery_cost: Decimal
    billing_amount: Decimal
    expected_profit: Decimal
    expected_margin_percentage: float
    currency: Literal["USD"]
    approval_status: str
    approved_by: int | None
    approved_at: datetime | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EstimationApprovalRequest(BaseModel):
    approved_by: int = Field(gt=0)


class EstimationApprovalResponse(EstimationResponse):
    opportunity_id: int
    opportunity_deal_value: Decimal
    lead_id: int | None
    lead_estimated_value: Decimal | None
    message: str


class EstimationRejectionRequest(EstimationApprovalRequest):
    estimation_id: int = Field(gt=0)
    rejection_reason: str = Field(min_length=1)


# =========================================================
# Resource requirement schemas
# =========================================================


class ResourceRequirementCreate(BaseModel):
    solution_id: int = Field(gt=0)

    role_name: str = Field(
        min_length=2,
        max_length=100,
    )

    skill_name: str = Field(
        min_length=2,
        max_length=100,
    )

    experience_level: str | None = Field(
        default=None,
        max_length=50,
    )

    minimum_experience_years: float = Field(
        default=0,
        ge=0,
    )

    quantity: int = Field(
        default=1,
        ge=1,
    )

    location_type: Literal[
        "ONSHORE",
        "OFFSHORE",
        "NEARSHORE",
    ] = "OFFSHORE"

    duration_months: float | None = Field(
        default=None,
        gt=0,
    )

    allocation_percentage: float = Field(
        default=100,
        gt=0,
        le=100,
    )

    cost_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    billing_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    availability_status: str = Field(
        default="PENDING",
        min_length=2,
        max_length=30,
    )


class ResourceRequirementPut(BaseModel):
    solution_id: int = Field(gt=0)

    role_name: str = Field(
        min_length=2,
        max_length=100,
    )

    skill_name: str = Field(
        min_length=2,
        max_length=100,
    )

    experience_level: str | None = Field(
        default=None,
        max_length=50,
    )

    minimum_experience_years: float = Field(ge=0)
    quantity: int = Field(ge=1)

    location_type: Literal[
        "ONSHORE",
        "OFFSHORE",
        "NEARSHORE",
    ]

    duration_months: float | None = Field(
        default=None,
        gt=0,
    )

    allocation_percentage: float = Field(
        gt=0,
        le=100,
    )

    cost_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    billing_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    availability_status: str = Field(
        min_length=2,
        max_length=30,
    )


class ResourceRequirementPatch(BaseModel):
    solution_id: int | None = Field(
        default=None,
        gt=0,
    )

    role_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    skill_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    experience_level: str | None = Field(
        default=None,
        max_length=50,
    )

    minimum_experience_years: float | None = Field(
        default=None,
        ge=0,
    )

    quantity: int | None = Field(
        default=None,
        ge=1,
    )

    location_type: Literal[
        "ONSHORE",
        "OFFSHORE",
        "NEARSHORE",
    ] | None = None

    duration_months: float | None = Field(
        default=None,
        gt=0,
    )

    allocation_percentage: float | None = Field(
        default=None,
        gt=0,
        le=100,
    )

    cost_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    billing_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    availability_status: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )


class ResourceRequirementResponse(BaseModel):
    id: int
    solution_id: int
    role_name: str
    skill_name: str
    experience_level: str | None
    minimum_experience_years: float
    quantity: int
    location_type: str
    duration_months: float | None
    allocation_percentage: float
    cost_rate: Decimal | None
    billing_rate: Decimal | None
    availability_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Proposal schemas
# =========================================================


class ProposalCreate(BaseModel):
    solution_id: int = Field(gt=0)

    proposal_title: str = Field(
        min_length=2,
        max_length=200,
    )

    version: str = Field(
        default="1.0",
        min_length=1,
        max_length=30,
    )

    sow_document_url: str | None = Field(
        default=None,
        max_length=500,
    )

    proposal_document_url: str | None = Field(
        default=None,
        max_length=500,
    )

    submission_date: date | None = None

    proposal_status: str = Field(
        default="DRAFT",
        min_length=2,
        max_length=30,
    )

    approval_status: str = Field(
        default="PENDING",
        min_length=2,
        max_length=30,
    )

    remarks: str | None = None


class ProposalPut(BaseModel):
    solution_id: int = Field(gt=0)

    proposal_title: str = Field(
        min_length=2,
        max_length=200,
    )

    version: str = Field(
        min_length=1,
        max_length=30,
    )

    sow_document_url: str | None = Field(
        default=None,
        max_length=500,
    )

    proposal_document_url: str | None = Field(
        default=None,
        max_length=500,
    )

    submission_date: date | None = None

    proposal_status: str = Field(
        min_length=2,
        max_length=30,
    )

    approval_status: str = Field(
        min_length=2,
        max_length=30,
    )

    remarks: str | None = None


class ProposalPatch(BaseModel):
    solution_id: int | None = Field(
        default=None,
        gt=0,
    )

    proposal_title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    version: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    sow_document_url: str | None = Field(
        default=None,
        max_length=500,
    )

    proposal_document_url: str | None = Field(
        default=None,
        max_length=500,
    )

    submission_date: date | None = None

    proposal_status: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    approval_status: str | None = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    remarks: str | None = None


class ProposalResponse(BaseModel):
    id: int
    solution_id: int
    proposal_title: str
    version: str
    sow_document_url: str | None
    proposal_document_url: str | None
    submission_date: date | None
    proposal_status: str
    approval_status: str
    remarks: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
