from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


# =========================================================
# RFP
# =========================================================


class RFPCreate(BaseModel):
    opportunity_id: int = Field(gt=0)

    rfp_number: str = Field(
        min_length=2,
        max_length=100,
    )

    title: str = Field(
        min_length=2,
        max_length=200,
    )

    client_name: str = Field(
        min_length=2,
        max_length=150,
    )

    industry: str | None = Field(
        default=None,
        max_length=100,
    )

    service_type: str | None = Field(
        default=None,
        max_length=100,
    )

    estimated_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(
        default="USD",
        min_length=3,
        max_length=10,
    )

    received_date: date
    submission_deadline: date

    rfp_status: str = Field(
        default="RECEIVED",
        max_length=30,
    )

    bid_decision: str = Field(
        default="PENDING",
        max_length=20,
    )

    source: str | None = Field(
        default=None,
        max_length=100,
    )

    description: str | None = None

    owner_id: int = Field(gt=0)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.submission_deadline < self.received_date:
            raise ValueError(
                "submission_deadline cannot be before received_date"
            )

        return self


class RFPPut(BaseModel):
    opportunity_id: int = Field(gt=0)

    rfp_number: str = Field(
        min_length=2,
        max_length=100,
    )

    title: str = Field(
        min_length=2,
        max_length=200,
    )

    client_name: str = Field(
        min_length=2,
        max_length=150,
    )

    industry: str | None = Field(
        default=None,
        max_length=100,
    )

    service_type: str | None = Field(
        default=None,
        max_length=100,
    )

    estimated_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(
        min_length=3,
        max_length=10,
    )

    received_date: date
    submission_deadline: date

    rfp_status: str = Field(
        min_length=2,
        max_length=30,
    )

    bid_decision: str = Field(
        min_length=2,
        max_length=20,
    )

    source: str | None = Field(
        default=None,
        max_length=100,
    )

    description: str | None = None

    owner_id: int = Field(gt=0)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.submission_deadline < self.received_date:
            raise ValueError(
                "submission_deadline cannot be before received_date"
            )

        return self


class RFPPatch(BaseModel):
    opportunity_id: int | None = Field(
        default=None,
        gt=0,
    )

    rfp_number: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    client_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    industry: str | None = Field(
        default=None,
        max_length=100,
    )

    service_type: str | None = Field(
        default=None,
        max_length=100,
    )

    estimated_value: Decimal | None = Field(
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

    received_date: date | None = None
    submission_deadline: date | None = None

    rfp_status: str | None = Field(
        default=None,
        max_length=30,
    )

    bid_decision: str | None = Field(
        default=None,
        max_length=20,
    )

    source: str | None = Field(
        default=None,
        max_length=100,
    )

    description: str | None = None

    owner_id: int | None = Field(
        default=None,
        gt=0,
    )


class RFPResponse(BaseModel):
    id: int
    opportunity_id: int | None
    rfp_number: str
    title: str
    client_name: str
    industry: str | None
    service_type: str | None
    estimated_value: Decimal | None
    currency: Literal["USD"]
    received_date: date
    submission_deadline: date
    rfp_status: str
    bid_decision: str
    source: str | None
    description: str | None
    owner_id: int
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

# =========================================================
# Bid Evaluation
# =========================================================


class BidEvaluationCreate(BaseModel):
    rfp_id: int = Field(gt=0)

    strategic_fit_score: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    technical_fit_score: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    resource_availability_score: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    profitability_score: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    win_probability: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    evaluated_by: int = Field(gt=0)

    comments: str | None = None


class BidEvaluationPut(BaseModel):
    rfp_id: int = Field(gt=0)

    strategic_fit_score: float = Field(
        ge=0,
        le=100,
    )

    technical_fit_score: float = Field(
        ge=0,
        le=100,
    )

    resource_availability_score: float = Field(
        ge=0,
        le=100,
    )

    profitability_score: float = Field(
        ge=0,
        le=100,
    )

    win_probability: float = Field(
        ge=0,
        le=100,
    )

    evaluated_by: int = Field(gt=0)

    comments: str | None = None


class BidEvaluationPatch(BaseModel):
    rfp_id: int | None = Field(
        default=None,
        gt=0,
    )

    strategic_fit_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    technical_fit_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    resource_availability_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    profitability_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    win_probability: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    evaluated_by: int | None = Field(
        default=None,
        gt=0,
    )

    comments: str | None = None


class BidEvaluationResponse(BaseModel):
    id: int
    rfp_id: int
    strategic_fit_score: float
    technical_fit_score: float
    resource_availability_score: float
    profitability_score: float
    win_probability: float
    overall_score: float
    recommendation: str
    evaluated_by: int
    comments: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
