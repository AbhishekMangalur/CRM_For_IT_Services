from calendar import monthrange
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.presale import (
    Estimation,
    Proposal,
    ResourceRequirement,
    Solution,
)
from app.models.resource_manager import ResourceRequest
from app.models.sale import Lead, Opportunity
from app.models.user import User
from app.repositories.presale_repository import (
    create_record,
    delete_record,
    get_all_records,
    get_record_by_id,
    update_record,
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


def require_opportunity(
    db: Session,
    opportunity_id: int,
) -> Opportunity:
    opportunity = db.get(Opportunity, opportunity_id)

    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found",
        )

    return opportunity


def require_presales_user(
    db: Session,
    user_id: int,
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

    if not user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {user_id} has no assigned role",
        )

    if user.role.name != "PRESALES":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {user_id} must have the PRESALES role",
        )

    return user


def require_solution(
    db: Session,
    solution_id: int,
) -> Solution:
    solution = get_record_by_id(
        db,
        Solution,
        solution_id,
    )

    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solution not found",
        )

    return solution


MINIMUM_MARGIN_PERCENTAGE = 40.0


def add_months(
    source_date: date,
    months: float,
) -> date:
    months = int(months)

    year = source_date.year + (source_date.month - 1 + months) // 12
    month = (source_date.month - 1 + months) % 12 + 1
    day = min(source_date.day, monthrange(year, month)[1])

    return date(year, month, day)


def apply_margin_approval_rule(
    data: dict[str, Any],
) -> dict[str, Any]:
    margin = float(
        data.get(
            "expected_margin_percentage",
            0,
        )
    )

    if margin >= MINIMUM_MARGIN_PERCENTAGE:
        data["approval_status"] = "APPROVED"
        data["approved_by"] = None
        data["approved_at"] = datetime.now(timezone.utc)
        data["rejection_reason"] = None
    else:
        data["approval_status"] = "APPROVAL_REQUIRED"
        data["approved_by"] = None
        data["approved_at"] = None
        data["rejection_reason"] = None

    return data


def synchronize_estimation_commercial_values(
    db: Session,
    estimation: Estimation,
) -> tuple[Opportunity, Lead | None]:
    """Apply an approved estimation to its solution and sales records.

    The caller owns the transaction so the estimation approval, solution
    approval, and commercial values are always committed (or rolled back)
    together.
    """
    solution = db.get(Solution, estimation.solution_id)

    if not solution:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The estimation is not linked to an existing solution",
        )

    opportunity = db.get(Opportunity, solution.opportunity_id)

    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The solution is not linked to an existing opportunity",
        )

    lead = (
        db.get(Lead, opportunity.lead_id)
        if opportunity.lead_id is not None
        else None
    )

    if opportunity.lead_id is not None and lead is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The opportunity is linked to a lead that no longer exists",
        )

    solution.solution_status = "APPROVED"
    opportunity.deal_value = estimation.billing_amount

    if lead is not None:
        lead.estimated_value = estimation.billing_amount

    return opportunity, lead


def validate_solution_relations(
    db: Session,
    data: dict[str, Any],
) -> None:
    opportunity_id = data.get("opportunity_id")

    if opportunity_id is not None:
        require_opportunity(db, opportunity_id)

    presales_owner_id = data.get("presales_owner_id")

    if presales_owner_id is not None:
        require_presales_user(
            db,
            presales_owner_id,
        )


def create_solution(
    db: Session,
    data: dict[str, Any],
) -> Solution:
    validate_solution_relations(db, data)

    try:
        return create_record(
            db,
            Solution,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_solutions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Solution]:
    return get_all_records(
        db,
        Solution,
        skip,
        limit,
    )


def get_solution(
    db: Session,
    solution_id: int,
) -> Solution:
    return require_solution(
        db,
        solution_id,
    )


def update_solution(
    db: Session,
    solution_id: int,
    data: dict[str, Any],
) -> Solution:
    solution = require_solution(
        db,
        solution_id,
    )

    validate_solution_relations(db, data)

    try:
        return update_record(
            db,
            solution,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_solution(
    db: Session,
    solution_id: int,
) -> None:
    solution = require_solution(
        db,
        solution_id,
    )

    try:
        delete_record(
            db,
            solution,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)

def require_estimation(
    db: Session,
    estimation_id: int,
) -> Estimation:
    estimation = get_record_by_id(
        db,
        Estimation,
        estimation_id,
    )

    if not estimation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimation not found",
        )

    return estimation


def get_estimation_by_solution_id(
    db: Session,
    solution_id: int,
) -> Estimation | None:
    return (
        db.query(Estimation)
        .filter(Estimation.solution_id == solution_id)
        .first()
    )


def calculate_estimation_values(
    data: dict[str, Any],
    existing_estimation: Estimation | None = None,
) -> dict[str, Any]:
    resource_cost = Decimal(
        str(
            data.get(
                "resource_cost",
                existing_estimation.resource_cost
                if existing_estimation
                else 0,
            )
        )
    )

    infrastructure_cost = Decimal(
        str(
            data.get(
                "infrastructure_cost",
                existing_estimation.infrastructure_cost
                if existing_estimation
                else 0,
            )
        )
    )

    overhead_cost = Decimal(
        str(
            data.get(
                "overhead_cost",
                existing_estimation.overhead_cost
                if existing_estimation
                else 0,
            )
        )
    )

    contingency_percentage = Decimal(
        str(
            data.get(
                "contingency_percentage",
                existing_estimation.contingency_percentage
                if existing_estimation
                else 0,
            )
        )
    )

    billing_amount = Decimal(
        str(
            data.get(
                "billing_amount",
                existing_estimation.billing_amount
                if existing_estimation
                else 0,
            )
        )
    )

    base_delivery_cost = (
        resource_cost
        + infrastructure_cost
        + overhead_cost
    )

    contingency_amount = (
        base_delivery_cost
        * contingency_percentage
        / Decimal("100")
    )

    total_delivery_cost = (
        base_delivery_cost
        + contingency_amount
    )

    expected_profit = (
        billing_amount
        - total_delivery_cost
    )

    expected_margin_percentage = Decimal("0")

    if billing_amount > 0:
        expected_margin_percentage = (
            expected_profit
            / billing_amount
            * Decimal("100")
        )

    money_places = Decimal("0.01")

    data["contingency_amount"] = contingency_amount.quantize(
        money_places,
        rounding=ROUND_HALF_UP,
    )

    data["total_delivery_cost"] = total_delivery_cost.quantize(
        money_places,
        rounding=ROUND_HALF_UP,
    )

    data["expected_profit"] = expected_profit.quantize(
        money_places,
        rounding=ROUND_HALF_UP,
    )

    data["expected_margin_percentage"] = float(
        expected_margin_percentage.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )
    )

    data = apply_margin_approval_rule(data)

    return data


def validate_estimation_relations(
    db: Session,
    data: dict[str, Any],
    existing_estimation: Estimation | None = None,
) -> None:
    solution_id = data.get(
        "solution_id",
        existing_estimation.solution_id
        if existing_estimation
        else None,
    )

    if solution_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="solution_id is required",
        )

    require_solution(db, solution_id)

    current_estimation = get_estimation_by_solution_id(
        db,
        solution_id,
    )

    if (
        current_estimation
        and (
            existing_estimation is None
            or current_estimation.id
            != existing_estimation.id
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An estimation already exists "
                "for this solution"
            ),
        )


def create_estimation(
    db: Session,
    data: dict[str, Any],
) -> Estimation:
    validate_estimation_relations(
        db,
        data,
    )

    calculated_data = calculate_estimation_values(
        data,
    )
    calculated_data = apply_margin_approval_rule(
        calculated_data,
    )

    try:
        estimation = Estimation(**calculated_data)
        db.add(estimation)
        db.flush()

        if estimation.approval_status == "APPROVED":
            synchronize_estimation_commercial_values(
                db,
                estimation,
            )

        db.commit()
        db.refresh(estimation)
        return estimation
    except IntegrityError as error:
        handle_integrity_error(db, error)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Estimation creation failed; commercial values were not "
                "synchronized"
            ),
        ) from error


def get_estimations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Estimation]:
    return get_all_records(
        db,
        Estimation,
        skip,
        limit,
    )


def get_estimation(
    db: Session,
    estimation_id: int,
) -> Estimation:
    return require_estimation(
        db,
        estimation_id,
    )


def update_estimation(
    db: Session,
    estimation_id: int,
    data: dict[str, Any],
) -> Estimation:
    estimation = require_estimation(
        db,
        estimation_id,
    )

    validate_estimation_relations(
        db,
        data,
        existing_estimation=estimation,
    )

    calculated_data = calculate_estimation_values(
        data,
        existing_estimation=estimation,
    )
    calculated_data = apply_margin_approval_rule(
        calculated_data,
    )

    try:
        for field_name, value in calculated_data.items():
            setattr(estimation, field_name, value)

        if estimation.approval_status == "APPROVED":
            synchronize_estimation_commercial_values(
                db,
                estimation,
            )

        db.commit()
        db.refresh(estimation)
        return estimation
    except IntegrityError as error:
        handle_integrity_error(db, error)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Estimation update failed; commercial values were not "
                "synchronized"
            ),
        ) from error


def approve_estimation(
    db: Session,
    estimation_id: int,
    approved_by: int,
) -> dict[str, Any]:
    estimation = require_estimation(
        db,
        estimation_id,
    )

    if estimation.approval_status not in {
        "APPROVAL_REQUIRED",
        "APPROVED",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This estimation does not require approval"
            ),
        )

    approver = db.get(User, approved_by)

    if not approver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approver user not found",
        )

    if not approver.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approver user is inactive",
        )

    if not approver.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approver user has no assigned role",
        )

    if approver.role.name not in {
        "ACCOUNT_DIRECTOR",
        "EXECUTIVE",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only ACCOUNT_DIRECTOR or EXECUTIVE "
                "can approve low-margin estimations"
            ),
        )

    try:
        # Approval and commercial synchronization must commit atomically.
        estimation.approval_status = "APPROVED"
        estimation.approved_by = approver.id
        estimation.approved_at = (
            estimation.approved_at or datetime.now(timezone.utc)
        )
        estimation.rejection_reason = None

        opportunity, lead = synchronize_estimation_commercial_values(
            db,
            estimation,
        )

        db.flush()
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Estimation approval failed; commercial values were not synchronized"
            ),
        ) from error

    response = {
        column.name: getattr(estimation, column.name)
        for column in Estimation.__table__.columns
    }
    response.update(
        {
            "opportunity_id": opportunity.id,
            "opportunity_deal_value": opportunity.deal_value,
            "lead_id": lead.id if lead is not None else None,
            "lead_estimated_value": (
                lead.estimated_value if lead is not None else None
            ),
            "message": (
                "Estimation and solution approved; commercial "
                "values synchronized successfully."
            ),
        }
    )

    return response


def reject_estimation(
    db: Session,
    estimation_id: int,
    approved_by: int,
    rejection_reason: str,
) -> Estimation:
    estimation = require_estimation(
        db,
        estimation_id,
    )

    if estimation.approval_status != "APPROVAL_REQUIRED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This estimation does not require approval"
            ),
        )

    approver = db.get(User, approved_by)

    if not approver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approver user not found",
        )

    if not approver.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approver user is inactive",
        )

    if not approver.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approver user has no assigned role",
        )

    if approver.role.name not in {
        "ACCOUNT_DIRECTOR",
        "EXECUTIVE",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only ACCOUNT_DIRECTOR or EXECUTIVE "
                "can reject low-margin estimations"
            ),
        )

    if not rejection_reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required",
        )

    solution = db.get(Solution, estimation.solution_id)

    if not solution:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The estimation is not linked to an existing solution",
        )

    try:
        estimation.approval_status = "REJECTED"
        estimation.approved_by = approver.id
        estimation.approved_at = datetime.now(timezone.utc)
        estimation.rejection_reason = rejection_reason.strip()
        solution.solution_status = "REJECTED"

        db.flush()
        db.commit()
        db.refresh(estimation)
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Estimation rejection failed; the linked solution was not "
                "rejected"
            ),
        ) from error

    return estimation


def delete_estimation(
    db: Session,
    estimation_id: int,
) -> None:
    estimation = require_estimation(
        db,
        estimation_id,
    )

    try:
        delete_record(
            db,
            estimation,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)

def require_resource_requirement(
    db: Session,
    requirement_id: int,
) -> ResourceRequirement:
    requirement = get_record_by_id(
        db,
        ResourceRequirement,
        requirement_id,
    )

    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource requirement not found",
        )

    return requirement


def validate_resource_requirement_relations(
    db: Session,
    data: dict[str, Any],
    existing_requirement: ResourceRequirement | None = None,
) -> None:
    solution_id = data.get(
        "solution_id",
        existing_requirement.solution_id
        if existing_requirement
        else None,
    )

    if solution_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="solution_id is required",
        )

    require_solution(db, solution_id)

    quantity = data.get(
        "quantity",
        existing_requirement.quantity
        if existing_requirement
        else 1,
    )

    if quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be at least 1",
        )

    allocation_percentage = data.get(
        "allocation_percentage",
        existing_requirement.allocation_percentage
        if existing_requirement
        else 100,
    )

    if not 0 < allocation_percentage <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Allocation percentage must be greater than 0 "
                "and less than or equal to 100"
            ),
        )

    minimum_experience_years = data.get(
        "minimum_experience_years",
        existing_requirement.minimum_experience_years
        if existing_requirement
        else 0,
    )

    if minimum_experience_years < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum experience years cannot be negative",
        )

    duration_months = data.get(
        "duration_months",
        existing_requirement.duration_months
        if existing_requirement
        else None,
    )

    if duration_months is not None and duration_months <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration months must be greater than 0",
        )

    cost_rate = data.get(
        "cost_rate",
        existing_requirement.cost_rate
        if existing_requirement
        else None,
    )

    if cost_rate is not None and cost_rate < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cost rate cannot be negative",
        )

    billing_rate = data.get(
        "billing_rate",
        existing_requirement.billing_rate
        if existing_requirement
        else None,
    )

    if billing_rate is not None and billing_rate < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billing rate cannot be negative",
        )


def create_resource_requirement(
    db: Session,
    data: dict[str, Any],
) -> ResourceRequirement:
    validate_resource_requirement_relations(
        db,
        data,
    )

    try:
        return create_record(
            db,
            ResourceRequirement,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_resource_requirements(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[ResourceRequirement]:
    return get_all_records(
        db,
        ResourceRequirement,
        skip,
        limit,
    )


def get_resource_requirement(
    db: Session,
    requirement_id: int,
) -> ResourceRequirement:
    return require_resource_requirement(
        db,
        requirement_id,
    )


def update_resource_requirement(
    db: Session,
    requirement_id: int,
    data: dict[str, Any],
) -> ResourceRequirement:
    requirement = require_resource_requirement(
        db,
        requirement_id,
    )

    validate_resource_requirement_relations(
        db,
        data,
        existing_requirement=requirement,
    )

    try:
        return update_record(
            db,
            requirement,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_resource_requirement(
    db: Session,
    requirement_id: int,
) -> None:
    requirement = require_resource_requirement(
        db,
        requirement_id,
    )

    try:
        delete_record(
            db,
            requirement,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)

def require_proposal(
    db: Session,
    proposal_id: int,
) -> Proposal:
    proposal = get_record_by_id(
        db,
        Proposal,
        proposal_id,
    )

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found",
        )

    return proposal


def validate_proposal_relations(
    db: Session,
    data: dict[str, Any],
    existing_proposal: Proposal | None = None,
) -> None:
    solution_id = data.get(
        "solution_id",
        existing_proposal.solution_id
        if existing_proposal
        else None,
    )

    if solution_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="solution_id is required",
        )

    require_solution(db, solution_id)

    proposal_status = data.get(
        "proposal_status",
        existing_proposal.proposal_status
        if existing_proposal
        else "DRAFT",
    )

    allowed_proposal_statuses = {
        "DRAFT",
        "IN_REVIEW",
        "SUBMITTED",
        "ACCEPTED",
        "REJECTED",
    }

    if proposal_status not in allowed_proposal_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid proposal status",
                "allowed_statuses": sorted(
                    allowed_proposal_statuses
                ),
            },
        )

    approval_status = data.get(
        "approval_status",
        existing_proposal.approval_status
        if existing_proposal
        else "PENDING",
    )

    allowed_approval_statuses = {
        "PENDING",
        "APPROVED",
        "REJECTED",
    }

    if approval_status not in allowed_approval_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid approval status",
                "allowed_statuses": sorted(
                    allowed_approval_statuses
                ),
            },
        )

    submission_date = data.get(
        "submission_date",
        existing_proposal.submission_date
        if existing_proposal
        else None,
    )

    if proposal_status == "SUBMITTED" and submission_date is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "submission_date is required when "
                "proposal_status is SUBMITTED"
            ),
        )


def create_proposal(
    db: Session,
    data: dict[str, Any],
    sow_document: bytes | None = None,
    sow_filename: str | None = None,
    proposal_document: bytes | None = None,
    proposal_filename: str | None = None,
) -> Proposal:
    validate_proposal_relations(
        db,
        data,
    )

    try:
        proposal = Proposal(
            **data,
            sow_document_filename=sow_filename,
            sow_document_content=sow_document,
            proposal_document_filename=proposal_filename,
            proposal_document_content=proposal_document,
        )
        db.add(proposal)
        db.flush()
        proposal.sow_document_url = (
            f"/api/presale/proposals/{proposal.id}/sow-document"
        )
        proposal.proposal_document_url = (
            f"/api/presale/proposals/{proposal.id}/proposal-document"
        )
        db.commit()
        db.refresh(proposal)
        return proposal
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_proposals(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Proposal]:
    return get_all_records(
        db,
        Proposal,
        skip,
        limit,
    )


def get_proposal(
    db: Session,
    proposal_id: int,
) -> Proposal:
    return require_proposal(
        db,
        proposal_id,
    )


def update_proposal(
    db: Session,
    proposal_id: int,
    data: dict[str, Any],
) -> Proposal:
    proposal = require_proposal(
        db,
        proposal_id,
    )

    update_data = dict(data)

    if proposal.approval_status == "REJECTED":
        update_data["approval_status"] = "PENDING"
        update_data["rejection_reason"] = None
        if update_data.get("proposal_status") == "REJECTED":
            update_data["proposal_status"] = "DRAFT"

    validate_proposal_relations(
        db,
        update_data,
        existing_proposal=proposal,
    )

    try:
        return update_record(
            db,
            proposal,
            update_data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def submit_proposal(
    db: Session,
    proposal_id: int,
) -> Proposal:
    proposal = require_proposal(
        db,
        proposal_id,
    )

    if (
        not proposal.sow_document_content
        or not proposal.proposal_document_content
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Both SOW and proposal PDF documents are required "
                "before submission"
            ),
        )

    proposal.proposal_status = "SUBMITTED"
    proposal.approval_status = "PENDING"

    if proposal.submission_date is None:
        proposal.submission_date = date.today()

    db.commit()
    db.refresh(proposal)

    return proposal


def approve_proposal(
    db: Session,
    proposal_id: int,
) -> Proposal:
    proposal = require_proposal(
        db,
        proposal_id,
    )

    proposal.approval_status = "APPROVED"
    proposal.proposal_status = "ACCEPTED"
    proposal.rejection_reason = None

    db.commit()
    db.refresh(proposal)

    return proposal


def reject_proposal(
    db: Session,
    proposal_id: int,
    approved_by: int,
    rejection_reason: str,
) -> Proposal:
    proposal = require_proposal(
        db,
        proposal_id,
    )

    approver = db.get(User, approved_by)

    if not approver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approver user not found",
        )

    if not approver.is_active or not approver.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approver must be an active user with an assigned role",
        )

    if approver.role.name not in {"ACCOUNT_DIRECTOR", "EXECUTIVE"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ACCOUNT_DIRECTOR or EXECUTIVE can reject proposals",
        )

    if not rejection_reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required",
        )

    proposal.approval_status = "REJECTED"
    proposal.proposal_status = "REJECTED"
    proposal.rejection_reason = rejection_reason.strip()

    db.commit()
    db.refresh(proposal)

    return proposal


def delete_proposal(
    db: Session,
    proposal_id: int,
) -> None:
    proposal = require_proposal(
        db,
        proposal_id,
    )

    try:
        delete_record(
            db,
            proposal,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def create_resource_requirement(
    db: Session,
    data: dict,
    requested_by: int,
) -> ResourceRequirement:

    solution = db.get(
        Solution,
        data["solution_id"],
    )

    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solution not found",
        )

    # ---------------------------------------------
    # Create Presales requirement
    # ---------------------------------------------

    requirement = ResourceRequirement(
        **data
    )

    try:
        db.add(requirement)

        # Important:
        # Generates requirement.id without committing.
        db.flush()

        # -----------------------------------------
        # Duplicate protection
        # -----------------------------------------

        existing_request = (
            db.query(ResourceRequest)
            .filter(
                ResourceRequest.resource_requirement_id
                == requirement.id
            )
            .first()
        )

        if existing_request:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A resource request already exists "
                    "for this resource requirement"
                ),
            )

        # -----------------------------------------
        # Dates
        # -----------------------------------------

        required_from = date.today()

        required_until = add_months(
            required_from,
            requirement.duration_months,
        )

        # -----------------------------------------
        # Automatic Resource Manager handoff
        # -----------------------------------------

        resource_request = ResourceRequest(
            resource_requirement_id=requirement.id,

            opportunity_id=solution.opportunity_id,

            solution_id=requirement.solution_id,

            requested_role=requirement.role_name,

            required_skill=requirement.skill_name,

            experience_level=(
                requirement.experience_level
            ),

            minimum_experience_years=(
                requirement.minimum_experience_years
            ),

            quantity=requirement.quantity,

            required_from=required_from,
            required_until=required_until,

            allocation_percentage=(
                requirement.allocation_percentage
            ),

            location_type=requirement.location_type,

            request_status="PENDING",

            requested_by=requested_by,

            notes=(
                "Automatically generated from the linked "
                "Presales Resource Requirement."
            ),
        )

        db.add(resource_request)

        # Both succeed together.
        db.commit()

        db.refresh(requirement)

        return requirement

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Unable to create resource requirement "
                "and linked resource request"
            ),
        ) from error

    except Exception:
        db.rollback()
        raise
