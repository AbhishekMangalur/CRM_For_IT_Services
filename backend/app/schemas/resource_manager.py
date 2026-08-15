from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


# =========================================================
# Employee schemas
# =========================================================


class EmployeeCreate(BaseModel):
    employee_code: str = Field(min_length=2, max_length=50)
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    designation: str = Field(min_length=2, max_length=100)
    department: str | None = Field(default=None, max_length=100)
    total_experience_years: float = Field(default=0, ge=0)
    location: str | None = Field(default=None, max_length=100)
    employment_type: str = Field(default="FULL_TIME", max_length=30)

    cost_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(default="USD", min_length=3, max_length=10)
    availability_status: str = Field(default="AVAILABLE", max_length=30)
    available_from: date | None = None

    current_utilization_percentage: float = Field(
        default=0,
        ge=0,
        le=100,
    )

    is_active: bool = True


class EmployeePut(BaseModel):
    employee_code: str = Field(min_length=2, max_length=50)
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    designation: str = Field(min_length=2, max_length=100)
    department: str | None = Field(default=None, max_length=100)
    total_experience_years: float = Field(ge=0)
    location: str | None = Field(default=None, max_length=100)
    employment_type: str = Field(min_length=2, max_length=30)

    cost_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(min_length=3, max_length=10)
    availability_status: str = Field(min_length=2, max_length=30)
    available_from: date | None = None

    current_utilization_percentage: float = Field(
        ge=0,
        le=100,
    )

    is_active: bool


class EmployeePatch(BaseModel):
    employee_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    email: EmailStr | None = None

    designation: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    department: str | None = Field(default=None, max_length=100)

    total_experience_years: float | None = Field(
        default=None,
        ge=0,
    )

    location: str | None = Field(default=None, max_length=100)
    employment_type: str | None = Field(default=None, max_length=30)

    cost_rate: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: Literal["USD"] | None = Field(default=None, min_length=3, max_length=10)
    availability_status: str | None = Field(default=None, max_length=30)
    available_from: date | None = None

    current_utilization_percentage: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    is_active: bool | None = None


class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    full_name: str
    email: EmailStr
    designation: str
    department: str | None
    total_experience_years: float
    location: str | None
    employment_type: str
    cost_rate: Decimal | None
    currency: Literal["USD"]
    availability_status: str
    available_from: date | None
    current_utilization_percentage: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Skill schemas
# =========================================================


class SkillCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = None
    is_active: bool = True


class SkillPut(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = None
    is_active: bool


class SkillPatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = None
    is_active: bool | None = None


class SkillResponse(BaseModel):
    id: int
    name: str
    category: str | None
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Employee skill schemas
# =========================================================


class EmployeeSkillCreate(BaseModel):
    employee_id: int = Field(gt=0)
    skill_id: int = Field(gt=0)
    proficiency_level: str = Field(min_length=2, max_length=30)
    experience_years: float = Field(default=0, ge=0)
    certification_name: str | None = Field(default=None, max_length=200)
    certification_number: str | None = Field(default=None, max_length=100)
    certification_expiry_date: date | None = None


class EmployeeSkillPut(BaseModel):
    employee_id: int = Field(gt=0)
    skill_id: int = Field(gt=0)
    proficiency_level: str = Field(min_length=2, max_length=30)
    experience_years: float = Field(ge=0)
    certification_name: str | None = Field(default=None, max_length=200)
    certification_number: str | None = Field(default=None, max_length=100)
    certification_expiry_date: date | None = None


class EmployeeSkillPatch(BaseModel):
    employee_id: int | None = Field(default=None, gt=0)
    skill_id: int | None = Field(default=None, gt=0)
    proficiency_level: str | None = Field(default=None, max_length=30)
    experience_years: float | None = Field(default=None, ge=0)
    certification_name: str | None = Field(default=None, max_length=200)
    certification_number: str | None = Field(default=None, max_length=100)
    certification_expiry_date: date | None = None


class EmployeeSkillResponse(BaseModel):
    id: int
    employee_id: int
    skill_id: int
    proficiency_level: str
    experience_years: float
    certification_name: str | None
    certification_number: str | None
    certification_expiry_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Resource request schemas
# =========================================================


class ResourceRequestCreate(BaseModel):
    opportunity_id: int = Field(gt=0)
    solution_id: int | None = Field(default=None, gt=0)
    requested_role: str = Field(min_length=2, max_length=100)
    required_skill: str = Field(min_length=2, max_length=100)
    experience_level: str | None = Field(default=None, max_length=50)
    minimum_experience_years: float = Field(default=0, ge=0)
    quantity: int = Field(default=1, ge=1)
    required_from: date
    required_until: date | None = None

    allocation_percentage: float = Field(
        default=100,
        gt=0,
        le=100,
    )

    location_type: str | None = Field(default=None, max_length=30)
    request_status: str = Field(default="PENDING", max_length=30)
    requested_by: int = Field(gt=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.required_until is not None
            and self.required_until < self.required_from
        ):
            raise ValueError(
                "required_until cannot be before required_from"
            )

        return self


class ResourceRequestPut(BaseModel):
    opportunity_id: int = Field(gt=0)
    solution_id: int | None = Field(default=None, gt=0)
    requested_role: str = Field(min_length=2, max_length=100)
    required_skill: str = Field(min_length=2, max_length=100)
    experience_level: str | None = Field(default=None, max_length=50)
    minimum_experience_years: float = Field(ge=0)
    quantity: int = Field(ge=1)
    required_from: date
    required_until: date | None = None
    allocation_percentage: float = Field(gt=0, le=100)
    location_type: str | None = Field(default=None, max_length=30)
    request_status: str = Field(min_length=2, max_length=30)
    requested_by: int = Field(gt=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.required_until is not None
            and self.required_until < self.required_from
        ):
            raise ValueError(
                "required_until cannot be before required_from"
            )

        return self


class ResourceRequestPatch(BaseModel):
    opportunity_id: int | None = Field(default=None, gt=0)
    solution_id: int | None = Field(default=None, gt=0)
    requested_role: str | None = Field(default=None, max_length=100)
    required_skill: str | None = Field(default=None, max_length=100)
    experience_level: str | None = Field(default=None, max_length=50)

    minimum_experience_years: float | None = Field(
        default=None,
        ge=0,
    )

    quantity: int | None = Field(default=None, ge=1)
    required_from: date | None = None
    required_until: date | None = None

    allocation_percentage: float | None = Field(
        default=None,
        gt=0,
        le=100,
    )

    location_type: str | None = Field(default=None, max_length=30)
    request_status: str | None = Field(default=None, max_length=30)
    requested_by: int | None = Field(default=None, gt=0)
    notes: str | None = None


class ResourceRequestResponse(BaseModel):
    id: int
    opportunity_id: int
    solution_id: int | None
    requested_role: str
    required_skill: str
    experience_level: str | None
    minimum_experience_years: float
    quantity: int
    required_from: date
    required_until: date | None
    allocation_percentage: float
    location_type: str | None
    request_status: str
    requested_by: int
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Resource allocation schemas
# =========================================================


class ResourceAllocationCreate(BaseModel):
    employee_id: int = Field(gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)
    solution_id: int | None = Field(default=None, gt=0)
    resource_request_id: int | None = Field(default=None, gt=0)
    allocation_type: str = Field(default="SOFT_BOOKING", max_length=30)

    allocation_percentage: float = Field(
        default=100,
        gt=0,
        le=100,
    )

    start_date: date
    end_date: date | None = None
    allocation_status: str = Field(default="PENDING", max_length=30)
    allocated_by: int = Field(gt=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_allocation(self):
        if (
            self.opportunity_id is None
            and self.solution_id is None
            and self.resource_request_id is None
        ):
            raise ValueError(
                "At least one of opportunity_id, solution_id, "
                "or resource_request_id must be provided"
            )

        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")

        return self


class ResourceAllocationPut(BaseModel):
    employee_id: int = Field(gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)
    solution_id: int | None = Field(default=None, gt=0)
    resource_request_id: int | None = Field(default=None, gt=0)
    allocation_type: str = Field(min_length=2, max_length=30)
    allocation_percentage: float = Field(gt=0, le=100)
    start_date: date
    end_date: date | None = None
    allocation_status: str = Field(min_length=2, max_length=30)
    allocated_by: int = Field(gt=0)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_allocation(self):
        if (
            self.opportunity_id is None
            and self.solution_id is None
            and self.resource_request_id is None
        ):
            raise ValueError(
                "At least one of opportunity_id, solution_id, "
                "or resource_request_id must be provided"
            )

        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")

        return self


class ResourceAllocationPatch(BaseModel):
    employee_id: int | None = Field(default=None, gt=0)
    opportunity_id: int | None = Field(default=None, gt=0)
    solution_id: int | None = Field(default=None, gt=0)
    resource_request_id: int | None = Field(default=None, gt=0)
    allocation_type: str | None = Field(default=None, max_length=30)

    allocation_percentage: float | None = Field(
        default=None,
        gt=0,
        le=100,
    )

    start_date: date | None = None
    end_date: date | None = None
    allocation_status: str | None = Field(default=None, max_length=30)
    allocated_by: int | None = Field(default=None, gt=0)
    notes: str | None = None


class ResourceAllocationResponse(BaseModel):
    id: int
    employee_id: int
    opportunity_id: int | None
    solution_id: int | None
    resource_request_id: int | None
    allocation_type: str
    allocation_percentage: float
    start_date: date
    end_date: date | None
    allocation_status: str
    allocated_by: int
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)