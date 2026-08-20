from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.presale import Solution
from app.models.rfp import RFP
from app.models.resource_manager import ResourceAllocation, ResourceRequest
from app.models.sale import Lead, Opportunity, SalesActivity
from app.models.user import User
from app.repositories.sales_repository import (
    create_record,
    delete_record,
    get_all_records,
    get_record_by_id,
    update_record,
)
from app.services.resource_manager_service import update_employee_utilization


def require_user(
    db: Session,
    user_id: int,
    expected_role: str | None = None,
) -> User:
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {user_id} is inactive",
        )

    if expected_role and user.role.name != expected_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"User with ID {user_id} must have the "
                f"{expected_role} role"
            ),
        )

    return user


def require_lead(
    db: Session,
    lead_id: int,
) -> Lead:
    lead = get_record_by_id(db, Lead, lead_id)

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    return lead


def require_opportunity(
    db: Session,
    opportunity_id: int,
) -> Opportunity:
    opportunity = get_record_by_id(
        db,
        Opportunity,
        opportunity_id,
    )

    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found",
        )

    return opportunity


def handle_integrity_error(
    db: Session,
    error: IntegrityError,
) -> None:
    db.rollback()

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="The operation conflicts with existing database records",
    ) from error


# =========================================================
# Lead service
# =========================================================


def create_lead(
    db: Session,
    data: dict[str, Any],
) -> Lead:
    require_user(
        db,
        data["assigned_sales_id"],
        expected_role="SALES",
    )

    try:
        return create_record(db, Lead, data)
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_leads(
    db: Session,
    skip: int,
    limit: int,
) -> list[Lead]:
    return get_all_records(db, Lead, skip, limit)


def get_lead(
    db: Session,
    lead_id: int,
) -> Lead:
    return require_lead(db, lead_id)


def update_lead(
    db: Session,
    lead_id: int,
    data: dict[str, Any],
) -> Lead:
    lead = require_lead(db, lead_id)

    assigned_sales_id = data.get("assigned_sales_id")

    if assigned_sales_id is not None:
        require_user(
            db,
            assigned_sales_id,
            expected_role="SALES",
        )

    try:
        return update_record(db, lead, data)
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_lead(
    db: Session,
    lead_id: int,
) -> None:
    lead = require_lead(db, lead_id)

    try:
        delete_record(db, lead)
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Opportunity service
# =========================================================


def validate_opportunity_relations(
    db: Session,
    data: dict[str, Any],
) -> None:
    lead_id = data.get("lead_id")

    if lead_id is not None:
        require_lead(db, lead_id)

    sales_owner_id = data.get("sales_owner_id")

    if sales_owner_id is not None:
        require_user(
            db,
            sales_owner_id,
            expected_role="SALES",
        )

    presales_owner_id = data.get("presales_owner_id")

    if presales_owner_id is not None:
        require_user(
            db,
            presales_owner_id,
            expected_role="PRESALES",
        )


def convert_lead_for_closed_won_opportunity(
    db: Session,
    opportunity: Opportunity,
    data: dict[str, Any],
) -> None:
    next_pipeline_stage = data.get(
        "pipeline_stage",
        opportunity.pipeline_stage,
    )

    if next_pipeline_stage != "CLOSED_WON":
        return

    lead_id = data.get("lead_id", opportunity.lead_id)

    if lead_id is None:
        return

    lead = require_lead(db, lead_id)
    lead.lead_status = "CONVERTED"


def synchronize_bookings_for_opportunity_outcome(
    db: Session,
    opportunity: Opportunity,
    data: dict[str, Any],
) -> None:
    next_status = data.get("status", opportunity.status).upper()
    next_pipeline_stage = data.get(
        "pipeline_stage",
        opportunity.pipeline_stage,
    ).upper()

    is_won = next_status == "WON" and next_pipeline_stage == "CLOSED_WON"
    is_lost = next_status == "LOST" or next_pipeline_stage == "CLOSED_LOST"

    if not is_won and not is_lost:
        return

    linked_soft_bookings = db.scalars(
        select(ResourceAllocation).where(
            ResourceAllocation.allocation_type == "SOFT_BOOKING",
            ResourceAllocation.allocation_status.in_({"PENDING", "CONFIRMED"}),
            or_(
                ResourceAllocation.opportunity_id == opportunity.id,
                ResourceAllocation.solution_id.in_(
                    select(Solution.id).where(
                        Solution.opportunity_id == opportunity.id,
                    )
                ),
                ResourceAllocation.resource_request_id.in_(
                    select(ResourceRequest.id).where(
                        ResourceRequest.opportunity_id == opportunity.id,
                    )
                ),
            ),
        )
    ).all()

    for allocation in linked_soft_bookings:
        if is_won:
            allocation.allocation_type = "HARD_BOOKING"
            allocation.allocation_status = "CONFIRMED"
        else:
            allocation.allocation_status = "CANCELLED"
            update_employee_utilization(
                allocation.employee,
                -allocation.allocation_percentage,
            )

    if is_won:
        linked_rfps = db.scalars(
            select(RFP).where(
                RFP.opportunity_id == opportunity.id,
            )
        ).all()

        for rfp in linked_rfps:
            rfp.rfp_status = "WON"
            if rfp.completed_at is None:
                rfp.completed_at = datetime.now(timezone.utc)

            for assignment in rfp.assignments:
                if assignment.assignment_status not in {
                    "COMPLETED",
                    "CANCELLED",
                }:
                    assignment.assignment_status = "COMPLETED"


def create_opportunity(
    db: Session,
    data: dict[str, Any],
) -> Opportunity:
    if data.get("deal_value") is None:
        data["deal_value"] = Decimal("0.00")

    validate_opportunity_relations(db, data)

    try:
        return create_record(db, Opportunity, data)
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_opportunities(
    db: Session,
    skip: int,
    limit: int,
) -> list[Opportunity]:
    return get_all_records(
        db,
        Opportunity,
        skip,
        limit,
    )


def get_opportunity(
    db: Session,
    opportunity_id: int,
) -> Opportunity:
    return require_opportunity(db, opportunity_id)


def update_opportunity(
    db: Session,
    opportunity_id: int,
    data: dict[str, Any],
) -> Opportunity:
    opportunity = require_opportunity(db, opportunity_id)

    if "deal_value" in data and data["deal_value"] is None:
        data["deal_value"] = Decimal("0.00")

    validate_opportunity_relations(db, data)

    convert_lead_for_closed_won_opportunity(
        db,
        opportunity,
        data,
    )

    synchronize_bookings_for_opportunity_outcome(
        db,
        opportunity,
        data,
    )

    try:
        return update_record(db, opportunity, data)
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_opportunity(
    db: Session,
    opportunity_id: int,
) -> None:
    opportunity = require_opportunity(db, opportunity_id)

    try:
        delete_record(db, opportunity)
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Sales activity service
# =========================================================


def validate_activity_relations(
    db: Session,
    data: dict[str, Any],
    existing_activity: SalesActivity | None = None,
) -> None:
    lead_id = data.get(
        "lead_id",
        existing_activity.lead_id if existing_activity else None,
    )

    opportunity_id = data.get(
        "opportunity_id",
        existing_activity.opportunity_id
        if existing_activity
        else None,
    )

    if lead_id is None and opportunity_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A sales activity must belong to a lead "
                "or an opportunity"
            ),
        )

    if lead_id is not None:
        require_lead(db, lead_id)

    if opportunity_id is not None:
        require_opportunity(db, opportunity_id)

    user_id = data.get("user_id")

    if user_id is not None:
        require_user(db, user_id)


def create_sales_activity(
    db: Session,
    data: dict[str, Any],
) -> SalesActivity:
    validate_activity_relations(db, data)

    try:
        return create_record(db, SalesActivity, data)
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_sales_activities(
    db: Session,
    skip: int,
    limit: int,
) -> list[SalesActivity]:
    return get_all_records(
        db,
        SalesActivity,
        skip,
        limit,
    )


def get_sales_activity(
    db: Session,
    activity_id: int,
) -> SalesActivity:
    activity = get_record_by_id(
        db,
        SalesActivity,
        activity_id,
    )

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales activity not found",
        )

    return activity


def update_sales_activity(
    db: Session,
    activity_id: int,
    data: dict[str, Any],
) -> SalesActivity:
    activity = get_sales_activity(db, activity_id)

    validate_activity_relations(
        db,
        data,
        existing_activity=activity,
    )

    try:
        return update_record(db, activity, data)
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_sales_activity(
    db: Session,
    activity_id: int,
) -> None:
    activity = get_sales_activity(db, activity_id)

    try:
        delete_record(db, activity)
    except IntegrityError as error:
        handle_integrity_error(db, error)
