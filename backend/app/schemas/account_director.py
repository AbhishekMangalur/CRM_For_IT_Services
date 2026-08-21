# validation schemas for account director related models
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


# =========================================================
# Account schemas
# =========================================================


class AccountCreate(BaseModel):
    account_name: str = Field(min_length=2, max_length=150)
    industry: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=255)
    primary_contact_name: str | None = Field(default=None, max_length=150)
    primary_contact_email: EmailStr | None = None
    primary_contact_phone: str | None = Field(default=None, max_length=30)
    account_director_id: int = Field(gt=0)

    annual_revenue: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(default="USD", min_length=3, max_length=10)
    customer_health_status: str = Field(default="GREEN", max_length=20)
    nps_score: float | None = Field(default=None, ge=-100, le=100)
    sla_status: str | None = Field(default=None, max_length=30)
    risk_level: str = Field(default="LOW", max_length=20)
    account_status: str = Field(default="ACTIVE", max_length=30)


class AccountPut(BaseModel):
    account_name: str = Field(min_length=2, max_length=150)
    industry: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=255)
    primary_contact_name: str | None = Field(default=None, max_length=150)
    primary_contact_email: EmailStr | None = None
    primary_contact_phone: str | None = Field(default=None, max_length=30)
    account_director_id: int = Field(gt=0)

    annual_revenue: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(min_length=3, max_length=10)
    customer_health_status: str = Field(min_length=2, max_length=20)
    nps_score: float | None = Field(default=None, ge=-100, le=100)
    sla_status: str | None = Field(default=None, max_length=30)
    risk_level: str = Field(min_length=2, max_length=20)
    account_status: str = Field(min_length=2, max_length=30)


class AccountPatch(BaseModel):
    account_name: str | None = Field(default=None, min_length=2, max_length=150)
    industry: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=255)
    primary_contact_name: str | None = Field(default=None, max_length=150)
    primary_contact_email: EmailStr | None = None
    primary_contact_phone: str | None = Field(default=None, max_length=30)
    account_director_id: int | None = Field(default=None, gt=0)

    annual_revenue: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] | None = Field(default=None, min_length=3, max_length=10)
    customer_health_status: str | None = Field(default=None, max_length=20)
    nps_score: float | None = Field(default=None, ge=-100, le=100)
    sla_status: str | None = Field(default=None, max_length=30)
    risk_level: str | None = Field(default=None, max_length=20)
    account_status: str | None = Field(default=None, max_length=30)


class AccountResponse(BaseModel):
    id: int
    account_name: str
    industry: str | None
    website: str | None
    primary_contact_name: str | None
    primary_contact_email: EmailStr | None
    primary_contact_phone: str | None
    account_director_id: int
    annual_revenue: Decimal | None
    currency: Literal["USD"]
    customer_health_status: str
    nps_score: float | None
    sla_status: str | None
    risk_level: str
    account_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Contract schemas
# =========================================================


class ContractCreate(BaseModel):
    account_id: int = Field(gt=0)
    contract_number: str = Field(min_length=2, max_length=100)
    contract_type: str = Field(min_length=2, max_length=50)

    contract_value: Decimal = Field(
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(default="USD", min_length=3, max_length=10)
    start_date: date
    end_date: date
    renewal_date: date | None = None
    renewal_status: str = Field(default="NOT_DUE", max_length=30)
    contract_status: str = Field(default="ACTIVE", max_length=30)
    document_url: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")

        if self.renewal_date and self.renewal_date < self.start_date:
            raise ValueError("renewal_date cannot be before start_date")

        return self


class ContractPut(ContractCreate):
    pass


class ContractPatch(BaseModel):
    account_id: int | None = Field(default=None, gt=0)
    contract_number: str | None = Field(default=None, min_length=2, max_length=100)
    contract_type: str | None = Field(default=None, min_length=2, max_length=50)

    contract_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] | None = Field(default=None, min_length=3, max_length=10)
    start_date: date | None = None
    end_date: date | None = None
    renewal_date: date | None = None
    renewal_status: str | None = Field(default=None, max_length=30)
    contract_status: str | None = Field(default=None, max_length=30)
    document_url: str | None = Field(default=None, max_length=500)


class ContractResponse(BaseModel):
    id: int
    account_id: int
    contract_number: str
    contract_type: str
    contract_value: Decimal
    currency: Literal["USD"]
    start_date: date
    end_date: date
    renewal_date: date | None
    renewal_status: str
    contract_status: str
    document_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Customer health schemas
# =========================================================


class CustomerHealthRecordCreate(BaseModel):
    account_id: int = Field(gt=0)
    delivery_score: float = Field(default=0, ge=0, le=100)
    financial_score: float = Field(default=0, ge=0, le=100)
    customer_satisfaction_score: float = Field(default=0, ge=0, le=100)
    sla_score: float = Field(default=0, ge=0, le=100)
    risk_reason: str | None = None


class CustomerHealthRecordPut(BaseModel):
    account_id: int = Field(gt=0)
    delivery_score: float = Field(ge=0, le=100)
    financial_score: float = Field(ge=0, le=100)
    customer_satisfaction_score: float = Field(ge=0, le=100)
    sla_score: float = Field(ge=0, le=100)
    risk_reason: str | None = None


class CustomerHealthRecordPatch(BaseModel):
    account_id: int | None = Field(default=None, gt=0)
    delivery_score: float | None = Field(default=None, ge=0, le=100)
    financial_score: float | None = Field(default=None, ge=0, le=100)
    customer_satisfaction_score: float | None = Field(default=None, ge=0, le=100)
    sla_score: float | None = Field(default=None, ge=0, le=100)
    risk_reason: str | None = None


class CustomerHealthRecordResponse(BaseModel):
    id: int
    account_id: int
    delivery_score: float
    financial_score: float
    customer_satisfaction_score: float
    sla_score: float
    overall_health_score: float
    health_status: str
    risk_reason: str | None
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Account opportunity schemas
# =========================================================


class AccountOpportunityCreate(BaseModel):
    account_id: int = Field(gt=0)
    opportunity_name: str = Field(min_length=2, max_length=200)
    service_type: str = Field(min_length=2, max_length=100)

    estimated_value: Decimal = Field(
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(default="USD", min_length=3, max_length=10)
    probability: float = Field(default=0, ge=0, le=100)
    expected_close_date: date | None = None
    status: str = Field(default="OPEN", max_length=30)
    created_by: int = Field(gt=0)
    notes: str | None = None


class AccountOpportunityPut(AccountOpportunityCreate):
    pass


class AccountOpportunityPatch(BaseModel):
    account_id: int | None = Field(default=None, gt=0)
    opportunity_name: str | None = Field(default=None, min_length=2, max_length=200)
    service_type: str | None = Field(default=None, min_length=2, max_length=100)

    estimated_value: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    currency: Literal["USD"] | None = Field(default=None, min_length=3, max_length=10)
    probability: float | None = Field(default=None, ge=0, le=100)
    expected_close_date: date | None = None
    status: str | None = Field(default=None, max_length=30)
    created_by: int | None = Field(default=None, gt=0)
    notes: str | None = None


class AccountOpportunityResponse(BaseModel):
    id: int
    account_id: int
    opportunity_name: str
    service_type: str
    estimated_value: Decimal
    currency: Literal["USD"]
    probability: float
    expected_close_date: date | None
    status: str
    created_by: int
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)