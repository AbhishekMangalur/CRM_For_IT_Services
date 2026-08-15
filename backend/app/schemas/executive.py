from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ExecutiveKPISnapshotGenerate(BaseModel):
    snapshot_month: date


class ExecutiveKPISnapshotResponse(BaseModel):
    id: int
    snapshot_month: date

    total_pipeline_value: Decimal
    forecast_revenue: Decimal
    actual_revenue: Decimal

    gross_margin_percentage: float
    win_rate: float
    resource_utilization_percentage: float
    bench_percentage: float

    account_expansion_revenue: Decimal
    partner_influenced_pipeline: Decimal

    active_opportunities: int
    won_opportunities: int
    lost_opportunities: int

    healthy_accounts: int
    at_risk_accounts: int

    active_contracts: int
    contracts_due_for_renewal: int

    total_employees: int
    available_employees: int
    allocated_employees: int

    pending_resource_requests: int
    pending_presales_approvals: int

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinancialSummaryResponse(BaseModel):
    total_records: int
    actual_revenue: Decimal
    actual_cost: Decimal
    actual_profit: Decimal
    actual_margin_percentage: Decimal
    projected_margin_percentage: Decimal | None
    margin_variance: Decimal | None
    timesheet_utilization_percentage: Decimal | None
    currency: str
