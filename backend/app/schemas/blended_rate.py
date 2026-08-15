from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BlendedRateItem(BaseModel):
    location_type: str = Field(
        min_length=2,
        max_length=30,
    )

    resource_ratio: Decimal = Field(
        gt=0,
        le=100,
        max_digits=5,
        decimal_places=2,
    )

    bill_rate: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    cost_rate: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: Literal["USD"] = Field(
        default="USD",
        min_length=3,
        max_length=10,
    )


class BlendedRateCalculateRequest(BaseModel):
    estimation_id: int = Field(gt=0)

    rates: list[BlendedRateItem] = Field(
        min_length=1,
    )

    @model_validator(mode="after")
    def validate_resource_ratio(self):
        total_ratio = sum(
            item.resource_ratio
            for item in self.rates
        )

        if total_ratio != Decimal("100"):
            raise ValueError(
                "Resource ratios must total exactly 100%"
            )

        currencies = {
            item.currency.upper()
            for item in self.rates
        }

        if len(currencies) != 1:
            raise ValueError(
                "All rate items must use the same currency"
            )

        return self


class BlendedRateItemResponse(BaseModel):
    id: int
    estimation_id: int
    location_type: str
    resource_ratio: Decimal
    bill_rate: Decimal
    cost_rate: Decimal
    currency: Literal["USD"]


class BlendedRateCalculateResponse(BaseModel):
    estimation_id: int

    total_ratio: Decimal

    blended_bill_rate: Decimal

    blended_cost_rate: Decimal

    blended_profit_per_hour: Decimal

    blended_margin_percentage: float

    currency: Literal["USD"]

    rates: list[BlendedRateItemResponse]