from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class ContractRenewalAlertResponse(BaseModel):
    contract_id: int
    account_id: int
    contract_number: str
    contract_value: Decimal
    currency: Literal["USD"]

    end_date: date
    renewal_date: date | None

    days_until_renewal: int
    alert_level: str
    renewal_status: str
