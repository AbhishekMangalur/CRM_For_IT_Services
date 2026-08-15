from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


# =========================================================
# Partner
# =========================================================


class PartnerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    partner_type: str = Field(min_length=2, max_length=50)
    partner_program: str | None = Field(default=None, max_length=150)
    partner_tier: str | None = Field(default=None, max_length=100)

    contact_name: str | None = Field(default=None, max_length=150)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    website: str | None = Field(default=None, max_length=255)

    is_active: bool = True
    notes: str | None = None


class PartnerPut(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    partner_type: str = Field(min_length=2, max_length=50)
    partner_program: str | None = Field(default=None, max_length=150)
    partner_tier: str | None = Field(default=None, max_length=100)

    contact_name: str | None = Field(default=None, max_length=150)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    website: str | None = Field(default=None, max_length=255)

    is_active: bool
    notes: str | None = None


class PartnerPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    partner_type: str | None = Field(default=None, max_length=50)
    partner_program: str | None = Field(default=None, max_length=150)
    partner_tier: str | None = Field(default=None, max_length=100)

    contact_name: str | None = Field(default=None, max_length=150)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=30)
    website: str | None = Field(default=None, max_length=255)

    is_active: bool | None = None
    notes: str | None = None


class PartnerResponse(BaseModel):
    id: int
    name: str
    partner_type: str
    partner_program: str | None
    partner_tier: str | None
    contact_name: str | None
    contact_email: EmailStr | None
    contact_phone: str | None
    website: str | None
    is_active: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Partner Deal Registration
# =========================================================


class PartnerDealRegistrationCreate(BaseModel):
    partner_id: int = Field(gt=0)
    opportunity_id: int = Field(gt=0)

    registration_reference: str | None = Field(
        default=None,
        max_length=150,
    )

    registration_status: str = Field(
        default="PENDING",
        max_length=30,
    )

    registered_on: date | None = None
    expiry_date: date | None = None

    expected_incentive: Decimal | None = Field(
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

    registered_by: int = Field(gt=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.registered_on is not None
            and self.expiry_date is not None
            and self.expiry_date < self.registered_on
        ):
            raise ValueError(
                "expiry_date cannot be before registered_on"
            )

        return self


class PartnerDealRegistrationPut(PartnerDealRegistrationCreate):
    pass


class PartnerDealRegistrationPatch(BaseModel):
    partner_id: int | None = Field(default=None, gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)

    registration_reference: str | None = Field(
        default=None,
        max_length=150,
    )

    registration_status: str | None = Field(
        default=None,
        max_length=30,
    )

    registered_on: date | None = None
    expiry_date: date | None = None

    expected_incentive: Decimal | None = Field(
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

    registered_by: int | None = Field(default=None, gt=0)
    notes: str | None = None


class PartnerDealRegistrationResponse(BaseModel):
    id: int
    partner_id: int
    opportunity_id: int
    registration_reference: str | None
    registration_status: str
    registered_on: date | None
    expiry_date: date | None
    expected_incentive: Decimal | None
    currency: Literal["USD"]
    registered_by: int
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Partner Influenced Opportunity
# =========================================================


class PartnerInfluencedOpportunityCreate(BaseModel):
    partner_id: int = Field(gt=0)
    opportunity_id: int = Field(gt=0)

    influence_type: str = Field(
        min_length=2,
        max_length=50,
    )

    influenced_value: Decimal | None = Field(
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

    referral_fee: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    tier_points: int = Field(default=0, ge=0)

    status: str = Field(
        default="ACTIVE",
        max_length=30,
    )

    notes: str | None = None


class PartnerInfluencedOpportunityPut(
    PartnerInfluencedOpportunityCreate
):
    pass


class PartnerInfluencedOpportunityPatch(BaseModel):
    partner_id: int | None = Field(default=None, gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)

    influence_type: str | None = Field(
        default=None,
        max_length=50,
    )

    influenced_value: Decimal | None = Field(
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

    referral_fee: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=14,
        decimal_places=2,
    )

    tier_points: int | None = Field(default=None, ge=0)
    status: str | None = Field(default=None, max_length=30)
    notes: str | None = None


class PartnerInfluencedOpportunityResponse(BaseModel):
    id: int
    partner_id: int
    opportunity_id: int
    influence_type: str
    influenced_value: Decimal | None
    currency: Literal["USD"]
    referral_fee: Decimal | None
    tier_points: int
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Partner Certification
# =========================================================


class PartnerCertificationCreate(BaseModel):
    partner_id: int = Field(gt=0)
    employee_id: int = Field(gt=0)

    certification_name: str = Field(
        min_length=2,
        max_length=200,
    )

    certification_level: str | None = Field(
        default=None,
        max_length=100,
    )

    certification_number: str | None = Field(
        default=None,
        max_length=150,
    )

    issued_date: date | None = None
    expiry_date: date | None = None

    verification_url: str | None = Field(
        default=None,
        max_length=500,
    )

    is_active: bool = True

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.issued_date is not None
            and self.expiry_date is not None
            and self.expiry_date < self.issued_date
        ):
            raise ValueError(
                "expiry_date cannot be before issued_date"
            )

        return self


class PartnerCertificationPut(PartnerCertificationCreate):
    pass


class PartnerCertificationPatch(BaseModel):
    partner_id: int | None = Field(default=None, gt=0)
    employee_id: int | None = Field(default=None, gt=0)

    certification_name: str | None = Field(
        default=None,
        max_length=200,
    )

    certification_level: str | None = Field(
        default=None,
        max_length=100,
    )

    certification_number: str | None = Field(
        default=None,
        max_length=150,
    )

    issued_date: date | None = None
    expiry_date: date | None = None

    verification_url: str | None = Field(
        default=None,
        max_length=500,
    )

    is_active: bool | None = None


class PartnerCertificationResponse(BaseModel):
    id: int
    partner_id: int
    employee_id: int
    certification_name: str
    certification_level: str | None
    certification_number: str | None
    issued_date: date | None
    expiry_date: date | None
    verification_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)