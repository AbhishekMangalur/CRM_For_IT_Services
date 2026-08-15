from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)


# =========================================================
# Lead schemas
# =========================================================


class LeadCreate(BaseModel):
    company_name: str = Field(min_length=2, max_length=150)
    contact_name: str = Field(min_length=2, max_length=150)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    designation: str | None = Field(default=None, max_length=100)
    lead_source: str | None = Field(default=None, max_length=100)

    lead_status: str = Field(
        default="NEW",
        min_length=2,
        max_length=50,
    )

    priority: str = Field(
        default="MEDIUM",
        min_length=2,
        max_length=20,
    )

    estimated_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    assigned_sales_id: int = Field(gt=0)
    next_follow_up_date: date | None = None
    notes: str | None = None


class LeadPut(BaseModel):
    company_name: str = Field(min_length=2, max_length=150)
    contact_name: str = Field(min_length=2, max_length=150)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    designation: str | None = Field(default=None, max_length=100)
    lead_source: str | None = Field(default=None, max_length=100)
    lead_status: str = Field(min_length=2, max_length=50)
    priority: str = Field(min_length=2, max_length=20)

    estimated_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    assigned_sales_id: int = Field(gt=0)
    next_follow_up_date: date | None = None
    notes: str | None = None


class LeadPatch(BaseModel):
    company_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    contact_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    designation: str | None = Field(default=None, max_length=100)
    lead_source: str | None = Field(default=None, max_length=100)
    lead_status: str | None = Field(default=None, max_length=50)
    priority: str | None = Field(default=None, max_length=20)

    estimated_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    assigned_sales_id: int | None = Field(default=None, gt=0)
    next_follow_up_date: date | None = None
    notes: str | None = None


class LeadResponse(BaseModel):
    id: int
    company_name: str
    contact_name: str
    contact_email: str | None
    contact_phone: str | None
    designation: str | None
    lead_source: str | None
    lead_status: str
    priority: str
    estimated_value: Decimal | None
    assigned_sales_id: int
    next_follow_up_date: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Opportunity schemas
# =========================================================


class OpportunityCreate(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    opportunity_name: str = Field(min_length=2, max_length=200)
    client_name: str = Field(min_length=2, max_length=150)
    service_type: str = Field(min_length=2, max_length=100)
    industry: str | None = Field(default=None, max_length=100)

    deal_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(default="USD", min_length=3, max_length=10)
    pipeline_stage: str = Field(
        default="PROSPECTING",
        max_length=50,
    )

    win_probability: float = Field(default=0, ge=0, le=100)
    expected_close_date: date | None = None
    expected_start_date: date | None = None
    sales_owner_id: int = Field(gt=0)
    presales_owner_id: int | None = Field(default=None, gt=0)
    status: str = Field(default="OPEN", max_length=30)
    description: str | None = None


class OpportunityPut(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    opportunity_name: str = Field(min_length=2, max_length=200)
    client_name: str = Field(min_length=2, max_length=150)
    service_type: str = Field(min_length=2, max_length=100)
    industry: str | None = Field(default=None, max_length=100)

    deal_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(min_length=3, max_length=10)
    pipeline_stage: str = Field(min_length=2, max_length=50)
    win_probability: float = Field(ge=0, le=100)
    expected_close_date: date | None = None
    expected_start_date: date | None = None
    sales_owner_id: int = Field(gt=0)
    presales_owner_id: int | None = Field(default=None, gt=0)
    status: str = Field(min_length=2, max_length=30)
    description: str | None = None


class OpportunityPatch(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)

    opportunity_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    client_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    service_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    industry: str | None = Field(default=None, max_length=100)

    deal_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] | None = Field(default=None, max_length=10)
    pipeline_stage: str | None = Field(default=None, max_length=50)
    win_probability: float | None = Field(default=None, ge=0, le=100)
    expected_close_date: date | None = None
    expected_start_date: date | None = None
    sales_owner_id: int | None = Field(default=None, gt=0)
    presales_owner_id: int | None = Field(default=None, gt=0)
    status: str | None = Field(default=None, max_length=30)
    description: str | None = None


class OpportunityResponse(BaseModel):
    id: int
    lead_id: int | None
    opportunity_name: str
    client_name: str
    service_type: str
    industry: str | None
    deal_value: Decimal
    currency: Literal["USD"]
    pipeline_stage: str
    win_probability: float
    expected_close_date: date | None
    expected_start_date: date | None
    sales_owner_id: int
    presales_owner_id: int | None
    status: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Sales activity schemas
# =========================================================


class SalesActivityCreate(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)
    user_id: int = Field(gt=0)
    activity_type: str = Field(min_length=2, max_length=50)
    subject: str = Field(min_length=2, max_length=200)
    activity_date: datetime
    next_follow_up_date: datetime | None = None
    notes: str | None = None
    status: str = Field(default="PLANNED", max_length=30)

    @model_validator(mode="after")
    def validate_parent(self):
        if self.lead_id is None and self.opportunity_id is None:
            raise ValueError(
                "Either lead_id or opportunity_id must be provided"
            )

        return self


class SalesActivityPut(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)
    user_id: int = Field(gt=0)
    activity_type: str = Field(min_length=2, max_length=50)
    subject: str = Field(min_length=2, max_length=200)
    activity_date: datetime
    next_follow_up_date: datetime | None = None
    notes: str | None = None
    status: str = Field(min_length=2, max_length=30)

    @model_validator(mode="after")
    def validate_parent(self):
        if self.lead_id is None and self.opportunity_id is None:
            raise ValueError(
                "Either lead_id or opportunity_id must be provided"
            )

        return self


class SalesActivityPatch(BaseModel):
    lead_id: int | None = Field(default=None, gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)
    user_id: int | None = Field(default=None, gt=0)
    activity_type: str | None = Field(default=None, max_length=50)
    subject: str | None = Field(default=None, max_length=200)
    activity_date: datetime | None = None
    next_follow_up_date: datetime | None = None
    notes: str | None = None
    status: str | None = Field(default=None, max_length=30)


class SalesActivityResponse(BaseModel):
    id: int
    lead_id: int | None
    opportunity_id: int | None
    user_id: int
    activity_type: str
    subject: str
    activity_date: datetime
    next_follow_up_date: datetime | None
    notes: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
