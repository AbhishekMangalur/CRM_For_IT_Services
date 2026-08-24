from datetime import date

from fastapi import HTTPException
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.account_director import AccountOpportunity
from app.models.alliance import Partner, PartnerInfluencedOpportunity
from app.models.rfp import RFP
from app.models.sale import Opportunity


# =========================================================
# 1. RFP TURNAROUND TIME
# =========================================================


def get_rfp_turnaround_kpi(
    db: Session,
):
    """
    Compare the planned response window with the actual completion time.
    Only RFPs with a recorded completion timestamp are considered.
    """

    rfps = (
        db.query(RFP)
        .filter(
            RFP.rfp_status.in_(
                [
                    "SUBMITTED",
                    "WON",
                    "LOST",
                ]
            )
        )
        .all()
    )

    turnaround_values = []

    for rfp in rfps:

        if (
            rfp.received_date is None
            or rfp.completed_at is None
        ):
            continue

        completed_date = (
            rfp.completed_at.date()
        )

        planned_turnaround_days = (
            rfp.submission_deadline - rfp.received_date
        ).days

        turnaround_days = (
            completed_date
            - rfp.received_date
        ).days

        if turnaround_days >= 0:
            turnaround_values.append(
                {
                    "rfp_id": rfp.id,
                    "rfp_number": rfp.rfp_number,
                    "title": rfp.title,
                    "received_date":
                        rfp.received_date,
                    "completed_date":
                        completed_date,
                    "submission_deadline":
                        rfp.submission_deadline,
                    "planned_turnaround_days":
                        planned_turnaround_days,
                    "turnaround_days":
                        turnaround_days,
                }
            )

    if not turnaround_values:
        return {
            "average_turnaround_days": 0,
            "completed_rfps": 0,
            "rfps": [],
        }

    average_turnaround = round(
        sum(
            item["turnaround_days"]
            for item in turnaround_values
        )
        / len(turnaround_values),
        2,
    )

    return {
        "average_turnaround_days":
            average_turnaround,

        "completed_rfps":
            len(turnaround_values),

        "rfps":
            turnaround_values,
    }


# =========================================================
# 2. REVENUE BY PARTNER
# =========================================================


def get_revenue_by_partner_kpi(
    db: Session,
):
    """Sum influenced value per partner, including partners with no value."""

    revenue = func.coalesce(
        func.sum(PartnerInfluencedOpportunity.influenced_value),
        0,
    )

    rows = (
        db.query(
            Partner.name.label("partner_name"),
            revenue.label("revenue"),
        )
        .outerjoin(
            PartnerInfluencedOpportunity,
            PartnerInfluencedOpportunity.partner_id == Partner.id,
        )
        .group_by(Partner.id, Partner.name)
        .order_by(revenue.desc(), Partner.name.asc())
        .all()
    )

    return [
        {
            "partner_name": row.partner_name,
            "revenue": float(row.revenue or 0),
        }
        for row in rows
    ]


def get_pipeline_values_kpi(
    db: Session,
):
    active_pipeline_value = (
        db.query(
            func.coalesce(
                func.sum(Opportunity.deal_value),
                0,
            )
        )
        .filter(Opportunity.status == "OPEN")
        .scalar()
    )

    closed_pipeline_value = (
        db.query(
            func.coalesce(
                func.sum(Opportunity.deal_value),
                0,
            )
        )
        .filter(
            Opportunity.pipeline_stage.in_(
                ["CLOSED_WON", "CLOSED_LOST"]
            ),
            Opportunity.status.in_(["WON", "LOST"]),
        )
        .scalar()
    )

    total_pipeline_value = (
        active_pipeline_value
        + closed_pipeline_value
    )

    return {
        "active_pipeline_value": float(
            active_pipeline_value or 0
        ),
        "closed_pipeline_value": float(
            closed_pipeline_value or 0
        ),
        "total_pipeline_value": float(
            total_pipeline_value or 0
        ),
    }


# =========================================================
# 3. ACCOUNT EXPANSION REVENUE
# =========================================================


def get_account_expansion_revenue_kpi(
    db: Session,
    year: int | None = None,
):
    """
    Account expansion revenue =
    WON AccountOpportunity value.

    Compare current year against previous year.
    """

    current_year = (
        year
        if year
        else date.today().year
    )

    previous_year = (
        current_year - 1
    )

    current_revenue = (
        db.query(
            func.coalesce(
                func.sum(
                    AccountOpportunity.estimated_value
                ),
                0,
            )
        )
        .filter(
            AccountOpportunity.status
            == "WON",

            extract(
                "year",
                AccountOpportunity.created_at,
            )
            == current_year,
        )
        .scalar()
    )

    previous_revenue = (
        db.query(
            func.coalesce(
                func.sum(
                    AccountOpportunity.estimated_value
                ),
                0,
            )
        )
        .filter(
            AccountOpportunity.status
            == "WON",

            extract(
                "year",
                AccountOpportunity.created_at,
            )
            == previous_year,
        )
        .scalar()
    )

    current_value = float(
        current_revenue or 0
    )

    previous_value = float(
        previous_revenue or 0
    )

    growth_amount = (
        current_value
        - previous_value
    )

    if previous_value > 0:
        growth_percentage = round(
            (
                growth_amount
                / previous_value
            )
            * 100,
            2,
        )
    else:
        growth_percentage = (
            100.0
            if current_value > 0
            else 0.0
        )

    return {
        "current_year":
            current_year,

        "previous_year":
            previous_year,

        "current_year_revenue":
            current_value,

        "previous_year_revenue":
            previous_value,

        "growth_amount":
            round(
                growth_amount,
                2,
            ),

        "growth_percentage":
            growth_percentage,
    }


# =========================================================
# 3. PARTNER-INFLUENCED PIPELINE
# =========================================================


def get_partner_influenced_pipeline_kpi(
    db: Session,
):
    """
    Pipeline value is based on active partner-influenced
    opportunities.

    WON influenced value is shown separately.
    """

    active_pipeline = (
        db.query(
            func.coalesce(
                func.sum(
                    PartnerInfluencedOpportunity
                    .influenced_value
                ),
                0,
            )
        )
        .join(
            Opportunity,
            PartnerInfluencedOpportunity.opportunity_id
            == Opportunity.id,
        )
        .filter(
            PartnerInfluencedOpportunity.status == "ACTIVE",
            Opportunity.status == "OPEN",
        )
        .scalar()
    )

    won_pipeline = (
        db.query(
            func.coalesce(
                func.sum(
                    PartnerInfluencedOpportunity
                    .influenced_value
                ),
                0,
            )
        )
        .join(
            Opportunity,
            PartnerInfluencedOpportunity.opportunity_id
            == Opportunity.id,
        )
        .filter(
            Opportunity.pipeline_stage == "CLOSED_WON",
            Opportunity.status == "WON",
        )
        .scalar()
    )

    active_deals = (
        db.query(
            func.count(
                PartnerInfluencedOpportunity.id
            )
        )
        .join(
            Opportunity,
            PartnerInfluencedOpportunity.opportunity_id
            == Opportunity.id,
        )
        .filter(
            PartnerInfluencedOpportunity.status == "ACTIVE",
            Opportunity.status == "OPEN",
        )
        .scalar()
    )

    won_deals = (
        db.query(
            func.count(
                PartnerInfluencedOpportunity.id
            )
        )
        .join(
            Opportunity,
            PartnerInfluencedOpportunity.opportunity_id
            == Opportunity.id,
        )
        .filter(
            Opportunity.pipeline_stage == "CLOSED_WON",
            Opportunity.status == "WON",
        )
        .scalar()
    )

    referral_fees = (
        db.query(
            func.coalesce(
                func.sum(
                    PartnerInfluencedOpportunity
                    .referral_fee
                ),
                0,
            )
        )
        .scalar()
    )

    tier_points = (
        db.query(
            func.coalesce(
                func.sum(
                    PartnerInfluencedOpportunity
                    .tier_points
                ),
                0,
            )
        )
        .scalar()
    )

    return {
        "partner_influenced_pipeline":
            float(active_pipeline or 0),

        "partner_influenced_won_value":
            float(won_pipeline or 0),

        "active_partner_deals":
            int(active_deals or 0),

        "won_partner_deals":
            int(won_deals or 0),

        "total_referral_fees":
            float(referral_fees or 0),

        "total_tier_points":
            int(tier_points or 0),
    }
