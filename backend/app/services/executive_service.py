from calendar import monthrange
from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.account_director import (
    Account,
    AccountOpportunity,
    Contract,
)
from app.models.alliance import PartnerInfluencedOpportunity
from app.models.executive import ExecutiveKPISnapshot
from app.models.presale import Estimation
from app.models.resource_manager import (
    Employee,
    ResourceRequest,
)
from app.models.sale import Opportunity
from app.repositories.executive_repository import (
    create_snapshot,
    delete_snapshot,
    get_all_snapshots,
    get_snapshot,
    get_snapshot_by_month,
)


def handle_integrity_error(
    db: Session,
    error: IntegrityError,
) -> None:
    db.rollback()

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="The operation conflicts with existing database records",
    ) from error


def normalize_snapshot_month(snapshot_month: date) -> date:
    """
    Store every monthly snapshot using the first day of the month.

    Example:
    2026-08-18 becomes 2026-08-01.
    """
    return snapshot_month.replace(day=1)


def get_month_range(snapshot_month: date) -> tuple[date, date]:
    normalized_month = normalize_snapshot_month(snapshot_month)

    last_day = monthrange(
        normalized_month.year,
        normalized_month.month,
    )[1]

    month_end = normalized_month.replace(day=last_day)

    return normalized_month, month_end


def decimal_or_zero(value: Decimal | None) -> Decimal:
    return value if value is not None else Decimal("0.00")


def percentage(
    numerator: int | float | Decimal,
    denominator: int | float | Decimal,
) -> float:
    if denominator == 0:
        return 0.0

    return round(
        float(numerator) / float(denominator) * 100,
        2,
    )


def require_snapshot(
    db: Session,
    snapshot_id: int,
) -> ExecutiveKPISnapshot:
    snapshot = get_snapshot(
        db,
        snapshot_id,
    )

    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Executive KPI snapshot not found",
        )

    return snapshot


def calculate_pipeline_kpis(
    db: Session,
) -> dict:
    total_pipeline_value = db.scalar(
        select(
            func.coalesce(
                func.sum(Opportunity.deal_value),
                0,
            )
        ).where(
            Opportunity.status == "OPEN"
        )
    )

    forecast_revenue = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    Opportunity.deal_value
                    * Opportunity.win_probability
                    / 100
                ),
                0,
            )
        ).where(
            Opportunity.status == "OPEN"
        )
    )

    active_opportunities = db.scalar(
        select(func.count(Opportunity.id)).where(
            Opportunity.status == "OPEN"
        )
    )

    won_opportunities = db.scalar(
        select(func.count(Opportunity.id)).where(
            Opportunity.status == "WON"
        )
    )

    lost_opportunities = db.scalar(
        select(func.count(Opportunity.id)).where(
            Opportunity.status == "LOST"
        )
    )

    closed_opportunities = (
        won_opportunities + lost_opportunities
    )

    win_rate = percentage(
        won_opportunities,
        closed_opportunities,
    )

    return {
        "total_pipeline_value": decimal_or_zero(
            total_pipeline_value
        ),
        "forecast_revenue": decimal_or_zero(
            forecast_revenue
        ),
        "active_opportunities": active_opportunities,
        "won_opportunities": won_opportunities,
        "lost_opportunities": lost_opportunities,
        "win_rate": win_rate,
    }


def calculate_margin_kpis(
    db: Session,
) -> dict:
    approved_estimations = db.scalars(
        select(Estimation).where(
            Estimation.approval_status == "APPROVED"
        )
    ).all()

    if not approved_estimations:
        return {
            "gross_margin_percentage": 0.0,
            "pending_presales_approvals": db.scalar(
                select(func.count(Estimation.id)).where(
                    Estimation.approval_status == "APPROVAL_REQUIRED"
                )
            ),
        }

    total_billing = sum(
        (
            estimation.billing_amount
            for estimation in approved_estimations
        ),
        Decimal("0.00"),
    )

    total_profit = sum(
        (
            estimation.expected_profit
            for estimation in approved_estimations
        ),
        Decimal("0.00"),
    )

    gross_margin_percentage = 0.0

    if total_billing > 0:
        gross_margin_percentage = round(
            float(total_profit / total_billing * 100),
            2,
        )

    pending_presales_approvals = db.scalar(
        select(func.count(Estimation.id)).where(
            Estimation.approval_status == "APPROVAL_REQUIRED"
        )
    )

    return {
        "gross_margin_percentage": gross_margin_percentage,
        "pending_presales_approvals": (
            pending_presales_approvals
        ),
    }


def calculate_resource_kpis(
    db: Session,
) -> dict:
    total_employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.is_active.is_(True)
        )
    )

    available_employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.is_active.is_(True),
            Employee.availability_status == "AVAILABLE",
        )
    )

    allocated_employees = db.scalar(
        select(func.count(Employee.id)).where(
            Employee.is_active.is_(True),
            Employee.availability_status.in_(
                {
                    "ALLOCATED",
                    "PARTIALLY_AVAILABLE",
                }
            ),
        )
    )

    average_utilization = db.scalar(
        select(
            func.coalesce(
                func.avg(
                    Employee.current_utilization_percentage
                ),
                0,
            )
        ).where(
            Employee.is_active.is_(True)
        )
    )

    resource_utilization_percentage = round(
        float(average_utilization or 0),
        2,
    )

    bench_percentage = round(
        100 - resource_utilization_percentage,
        2,
    )

    pending_resource_requests = db.scalar(
        select(func.count(ResourceRequest.id)).where(
            ResourceRequest.request_status == "PENDING"
        )
    )

    return {
        "total_employees": total_employees,
        "available_employees": available_employees,
        "allocated_employees": allocated_employees,
        "resource_utilization_percentage": (
            resource_utilization_percentage
        ),
        "bench_percentage": bench_percentage,
        "pending_resource_requests": (
            pending_resource_requests
        ),
    }


def calculate_account_kpis(
    db: Session,
    month_start: date,
    month_end: date,
) -> dict:
    healthy_accounts = db.scalar(
        select(func.count(Account.id)).where(
            Account.customer_health_status == "GREEN",
            Account.account_status == "ACTIVE",
        )
    )

    at_risk_accounts = db.scalar(
        select(func.count(Account.id)).where(
            Account.customer_health_status.in_(
                {
                    "YELLOW",
                    "RED",
                }
            ),
            Account.account_status == "ACTIVE",
        )
    )

    active_contracts = db.scalar(
        select(func.count(Contract.id)).where(
            Contract.contract_status == "ACTIVE"
        )
    )

    contracts_due_for_renewal = db.scalar(
        select(func.count(Contract.id)).where(
            Contract.renewal_date.is_not(None),
            Contract.renewal_date >= month_start,
            Contract.renewal_date <= month_end,
            Contract.contract_status == "ACTIVE",
        )
    )

    account_expansion_revenue = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    AccountOpportunity.estimated_value
                ),
                0,
            )
        ).where(
            AccountOpportunity.status == "WON"
        )
    )

    return {
        "healthy_accounts": healthy_accounts,
        "at_risk_accounts": at_risk_accounts,
        "active_contracts": active_contracts,
        "contracts_due_for_renewal": (
            contracts_due_for_renewal
        ),
        "account_expansion_revenue": decimal_or_zero(
            account_expansion_revenue
        ),
    }

def build_snapshot_data(
    db: Session,
    snapshot_month: date,
) -> dict:
    normalized_month = normalize_snapshot_month(snapshot_month)
    month_start, month_end = get_month_range(normalized_month)

    pipeline_kpis = calculate_pipeline_kpis(db)
    margin_kpis = calculate_margin_kpis(db)
    resource_kpis = calculate_resource_kpis(db)
    account_kpis = calculate_account_kpis(
        db,
        month_start,
        month_end,
    )

    partner_influenced_pipeline = (
        db.query(
            func.coalesce(
                func.sum(
                    PartnerInfluencedOpportunity.influenced_value
                ),
                0,
            )
        )
        .filter(
            PartnerInfluencedOpportunity.status
            == "ACTIVE"
        )
        .scalar()
    )

    return {
        "snapshot_month": normalized_month,
        "total_pipeline_value": (
            pipeline_kpis["total_pipeline_value"]
        ),
        "forecast_revenue": (
            pipeline_kpis["forecast_revenue"]
        ),

        # No billing or invoice table exists yet.
        "actual_revenue": Decimal("0.00"),

        "gross_margin_percentage": (
            margin_kpis["gross_margin_percentage"]
        ),
        "win_rate": pipeline_kpis["win_rate"],
        "resource_utilization_percentage": (
            resource_kpis[
                "resource_utilization_percentage"
            ]
        ),
        "bench_percentage": (
            resource_kpis["bench_percentage"]
        ),
        "account_expansion_revenue": (
            account_kpis["account_expansion_revenue"]
        ),
        "partner_influenced_pipeline": (
            decimal_or_zero(partner_influenced_pipeline)
        ),

        "active_opportunities": (
            pipeline_kpis["active_opportunities"]
        ),
        "won_opportunities": (
            pipeline_kpis["won_opportunities"]
        ),
        "lost_opportunities": (
            pipeline_kpis["lost_opportunities"]
        ),
        "healthy_accounts": (
            account_kpis["healthy_accounts"]
        ),
        "at_risk_accounts": (
            account_kpis["at_risk_accounts"]
        ),
        "active_contracts": (
            account_kpis["active_contracts"]
        ),
        "contracts_due_for_renewal": (
            account_kpis["contracts_due_for_renewal"]
        ),
        "total_employees": (
            resource_kpis["total_employees"]
        ),
        "available_employees": (
            resource_kpis["available_employees"]
        ),
        "allocated_employees": (
            resource_kpis["allocated_employees"]
        ),
        "pending_resource_requests": (
            resource_kpis["pending_resource_requests"]
        ),
        "pending_presales_approvals": (
            margin_kpis["pending_presales_approvals"]
        ),
    }


def generate_kpi_snapshot(
    db: Session,
    snapshot_month: date,
) -> ExecutiveKPISnapshot:
    normalized_month = normalize_snapshot_month(
        snapshot_month
    )

    existing_snapshot = get_snapshot_by_month(
        db,
        normalized_month,
    )

    if existing_snapshot:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A KPI snapshot already exists for "
                f"{normalized_month.strftime('%B %Y')}"
            ),
        )

    snapshot_data = build_snapshot_data(
        db,
        normalized_month,
    )

    snapshot = ExecutiveKPISnapshot(
        **snapshot_data
    )

    try:
        return create_snapshot(
            db,
            snapshot,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def regenerate_kpi_snapshot(
    db: Session,
    snapshot_id: int,
) -> ExecutiveKPISnapshot:
    snapshot = require_snapshot(
        db,
        snapshot_id,
    )

    snapshot_data = build_snapshot_data(
        db,
        snapshot.snapshot_month,
    )

    try:
        for field_name, value in snapshot_data.items():
            setattr(
                snapshot,
                field_name,
                value,
            )

        db.commit()
        db.refresh(snapshot)

        return snapshot

    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_kpi_snapshots(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[ExecutiveKPISnapshot]:
    return get_all_snapshots(
        db,
        skip,
        limit,
    )


def get_kpi_snapshot(
    db: Session,
    snapshot_id: int,
) -> ExecutiveKPISnapshot:
    return require_snapshot(
        db,
        snapshot_id,
    )


def get_latest_kpi_snapshot(
    db: Session,
) -> ExecutiveKPISnapshot:
    snapshots = get_all_snapshots(
        db,
        skip=0,
        limit=1,
    )

    if not snapshots:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No executive KPI snapshots found",
        )

    return snapshots[0]


def delete_kpi_snapshot(
    db: Session,
    snapshot_id: int,
) -> None:
    snapshot = require_snapshot(
        db,
        snapshot_id,
    )

    try:
        delete_snapshot(
            db,
            snapshot,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )
