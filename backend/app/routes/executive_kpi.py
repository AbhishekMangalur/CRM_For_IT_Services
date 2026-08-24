from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.services.executive_kpi_service import (
    get_account_expansion_revenue_kpi,
    get_partner_influenced_pipeline_kpi,
    get_pipeline_values_kpi,
    get_revenue_by_partner_kpi,
    get_rfp_turnaround_kpi,
)

router = APIRouter(
    prefix="/api/executive/kpis",
    tags=["Executive KPIs"],
    dependencies=[
        Depends(get_current_user)
    ],
)


@router.get("/pipeline-values")
def get_pipeline_values_api(
    db: Session = Depends(get_db),
):
    return get_pipeline_values_kpi(db)


@router.get("/revenue-by-partner")
def get_revenue_by_partner_api(
    db: Session = Depends(get_db),
):
    return get_revenue_by_partner_kpi(db)


# =========================================================
# RFP Turnaround
# =========================================================


@router.get(
    "/rfp-turnaround"
)
def get_rfp_turnaround_api(
    db: Session = Depends(get_db),
):
    return get_rfp_turnaround_kpi(
        db
    )


# =========================================================
# Account Expansion Revenue
# =========================================================


@router.get(
    "/account-expansion"
)
def get_account_expansion_api(
    year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
    ),
    db: Session = Depends(get_db),
):
    return get_account_expansion_revenue_kpi(
        db=db,
        year=year,
    )


# =========================================================
# Partner Influenced Pipeline
# =========================================================


@router.get(
    "/partner-influenced-pipeline"
)
def get_partner_pipeline_api(
    db: Session = Depends(get_db),
):
    return get_partner_influenced_pipeline_kpi(
        db
    )
