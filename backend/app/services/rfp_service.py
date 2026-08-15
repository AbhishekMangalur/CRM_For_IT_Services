from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.rfp import (
    BidEvaluation,
    RFP,
    RFPAssignment,
)
from app.models.user import User
from app.repositories.rfp_repository import (
    create_record,
    delete_record,
    get_all_records,
    get_assignment_for_user,
    get_assignments_by_rfp,
    get_assignments_by_user,
    get_evaluations_by_rfp,
    get_latest_evaluation_for_rfp,
    get_record_by_id,
    get_rfp_by_number,
    get_rfps_by_bid_decision,
    get_rfps_by_status,
    update_record,
)


# =========================================================
# Common helpers
# =========================================================


def handle_integrity_error(
    db: Session,
    error: IntegrityError,
) -> None:
    db.rollback()

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="The operation conflicts with existing database records",
    ) from error


def require_user(
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

    return user


# =========================================================
# RFP
# =========================================================


def require_rfp(
    db: Session,
    rfp_id: int,
) -> RFP:
    rfp = get_record_by_id(
        db,
        RFP,
        rfp_id,
    )

    if not rfp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFP not found",
        )

    return rfp


def normalize_rfp_data(
    data: dict[str, Any],
) -> dict[str, Any]:
    if "rfp_number" in data and data["rfp_number"]:
        data["rfp_number"] = (
            data["rfp_number"]
            .strip()
            .upper()
        )

    if "title" in data and data["title"]:
        data["title"] = data["title"].strip()

    if "client_name" in data and data["client_name"]:
        data["client_name"] = data["client_name"].strip()

    return data


def validate_rfp(
    db: Session,
    data: dict[str, Any],
    existing_rfp: RFP | None = None,
) -> None:
    owner_id = data.get(
        "owner_id",
        existing_rfp.owner_id
        if existing_rfp
        else None,
    )

    if owner_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="owner_id is required",
        )

    owner = require_user(
        db,
        owner_id,
    )

    if owner.role.name not in {
        "SALES",
        "PRESALES",
        "ACCOUNT_DIRECTOR",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "RFP owner must have SALES, PRESALES, "
                "or ACCOUNT_DIRECTOR role"
            ),
        )

    rfp_number = data.get(
        "rfp_number",
        existing_rfp.rfp_number
        if existing_rfp
        else None,
    )

    if rfp_number:
        duplicate = get_rfp_by_number(
            db,
            rfp_number.strip().upper(),
        )

        if (
            duplicate
            and (
                existing_rfp is None
                or duplicate.id != existing_rfp.id
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="RFP number already exists",
            )

    received_date = data.get(
        "received_date",
        existing_rfp.received_date
        if existing_rfp
        else None,
    )

    submission_deadline = data.get(
        "submission_deadline",
        existing_rfp.submission_deadline
        if existing_rfp
        else None,
    )

    if (
        received_date is not None
        and submission_deadline is not None
        and submission_deadline < received_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "submission_deadline cannot be "
                "before received_date"
            ),
        )


def create_rfp(
    db: Session,
    data: dict[str, Any],
) -> RFP:
    data = normalize_rfp_data(data)

    validate_rfp(
        db,
        data,
    )

    try:
        return create_record(
            db,
            RFP,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_rfps(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[RFP]:
    return get_all_records(
        db,
        RFP,
        skip,
        limit,
    )


def get_rfp(
    db: Session,
    rfp_id: int,
) -> RFP:
    return require_rfp(
        db,
        rfp_id,
    )


def get_rfps_for_status(
    db: Session,
    rfp_status: str,
) -> list[RFP]:
    return get_rfps_by_status(
        db,
        rfp_status,
    )


def get_rfps_for_bid_decision(
    db: Session,
    bid_decision: str,
) -> list[RFP]:
    return get_rfps_by_bid_decision(
        db,
        bid_decision,
    )


def update_rfp(
    db: Session,
    rfp_id: int,
    data: dict[str, Any],
) -> RFP:
    rfp = require_rfp(
        db,
        rfp_id,
    )

    data = normalize_rfp_data(data)

    validate_rfp(
        db,
        data,
        existing_rfp=rfp,
    )

    try:
        return update_record(
            db,
            rfp,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def delete_rfp(
    db: Session,
    rfp_id: int,
) -> None:
    rfp = require_rfp(
        db,
        rfp_id,
    )

    try:
        delete_record(
            db,
            rfp,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


# =========================================================
# Bid Evaluation
# =========================================================


def require_bid_evaluation(
    db: Session,
    evaluation_id: int,
) -> BidEvaluation:
    evaluation = get_record_by_id(
        db,
        BidEvaluation,
        evaluation_id,
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid evaluation not found",
        )

    return evaluation


def calculate_bid_evaluation(
    data: dict[str, Any],
    existing_evaluation: BidEvaluation | None = None,
) -> dict[str, Any]:
    strategic_fit = data.get(
        "strategic_fit_score",
        existing_evaluation.strategic_fit_score
        if existing_evaluation
        else 0,
    )

    technical_fit = data.get(
        "technical_fit_score",
        existing_evaluation.technical_fit_score
        if existing_evaluation
        else 0,
    )

    resource_availability = data.get(
        "resource_availability_score",
        existing_evaluation.resource_availability_score
        if existing_evaluation
        else 0,
    )

    profitability = data.get(
        "profitability_score",
        existing_evaluation.profitability_score
        if existing_evaluation
        else 0,
    )

    win_probability = data.get(
        "win_probability",
        existing_evaluation.win_probability
        if existing_evaluation
        else 0,
    )

    overall_score = round(
        (
            strategic_fit
            + technical_fit
            + resource_availability
            + profitability
            + win_probability
        )
        / 5,
        2,
    )

    if overall_score >= 60:
        recommendation = "BID"
    else:
        recommendation = "NO_BID"

    data["overall_score"] = overall_score
    data["recommendation"] = recommendation

    return data


def validate_bid_evaluation(
    db: Session,
    data: dict[str, Any],
    existing_evaluation: BidEvaluation | None = None,
) -> RFP:
    rfp_id = data.get(
        "rfp_id",
        existing_evaluation.rfp_id
        if existing_evaluation
        else None,
    )

    evaluated_by = data.get(
        "evaluated_by",
        existing_evaluation.evaluated_by
        if existing_evaluation
        else None,
    )

    if rfp_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rfp_id is required",
        )

    rfp = require_rfp(
        db,
        rfp_id,
    )

    if evaluated_by is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="evaluated_by is required",
        )

    evaluator = require_user(
        db,
        evaluated_by,
    )

    if evaluator.role.name not in {
        "SALES",
        "PRESALES",
        "ACCOUNT_DIRECTOR",
        "RESOURCE_MANAGER",
        "EXECUTIVE",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User cannot evaluate this RFP",
        )

    return rfp


def sync_rfp_bid_decision(
    rfp: RFP,
    evaluation: BidEvaluation,
) -> None:
    rfp.bid_decision = evaluation.recommendation

    if evaluation.recommendation == "BID":
        if rfp.rfp_status == "RECEIVED":
            rfp.rfp_status = "EVALUATED"
    else:
        rfp.rfp_status = "NO_BID"


def create_bid_evaluation(
    db: Session,
    data: dict[str, Any],
) -> BidEvaluation:
    rfp = validate_bid_evaluation(
        db,
        data,
    )

    calculated_data = calculate_bid_evaluation(
        data,
    )

    try:
        evaluation = BidEvaluation(
            **calculated_data
        )

        db.add(evaluation)
        db.flush()

        sync_rfp_bid_decision(
            rfp,
            evaluation,
        )

        db.commit()
        db.refresh(evaluation)

        return evaluation

    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_bid_evaluations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[BidEvaluation]:
    return get_all_records(
        db,
        BidEvaluation,
        skip,
        limit,
    )


def get_bid_evaluation(
    db: Session,
    evaluation_id: int,
) -> BidEvaluation:
    return require_bid_evaluation(
        db,
        evaluation_id,
    )


def get_rfp_evaluations(
    db: Session,
    rfp_id: int,
) -> list[BidEvaluation]:
    require_rfp(
        db,
        rfp_id,
    )

    return get_evaluations_by_rfp(
        db,
        rfp_id,
    )


def get_latest_rfp_evaluation(
    db: Session,
    rfp_id: int,
) -> BidEvaluation:
    require_rfp(
        db,
        rfp_id,
    )

    evaluation = get_latest_evaluation_for_rfp(
        db,
        rfp_id,
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No evaluation exists for this RFP",
        )

    return evaluation


def update_bid_evaluation(
    db: Session,
    evaluation_id: int,
    data: dict[str, Any],
) -> BidEvaluation:
    evaluation = require_bid_evaluation(
        db,
        evaluation_id,
    )

    rfp = validate_bid_evaluation(
        db,
        data,
        existing_evaluation=evaluation,
    )

    calculated_data = calculate_bid_evaluation(
        data,
        existing_evaluation=evaluation,
    )

    try:
        for field_name, value in calculated_data.items():
            setattr(
                evaluation,
                field_name,
                value,
            )

        db.flush()

        sync_rfp_bid_decision(
            rfp,
            evaluation,
        )

        db.commit()
        db.refresh(evaluation)

        return evaluation

    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def delete_bid_evaluation(
    db: Session,
    evaluation_id: int,
) -> None:
    evaluation = require_bid_evaluation(
        db,
        evaluation_id,
    )

    try:
        delete_record(
            db,
            evaluation,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


# =========================================================
# RFP Assignment
# =========================================================


def require_rfp_assignment(
    db: Session,
    assignment_id: int,
) -> RFPAssignment:
    assignment = get_record_by_id(
        db,
        RFPAssignment,
        assignment_id,
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFP assignment not found",
        )

    return assignment


def validate_rfp_assignment(
    db: Session,
    data: dict[str, Any],
    existing_assignment: RFPAssignment | None = None,
) -> None:
    rfp_id = data.get(
        "rfp_id",
        existing_assignment.rfp_id
        if existing_assignment
        else None,
    )

    user_id = data.get(
        "user_id",
        existing_assignment.user_id
        if existing_assignment
        else None,
    )

    if rfp_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rfp_id is required",
        )

    rfp = require_rfp(
        db,
        rfp_id,
    )

    if rfp.bid_decision != "BID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Users can only be assigned after "
                "the RFP decision is BID"
            ),
        )

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required",
        )

    require_user(
        db,
        user_id,
    )

    duplicate = get_assignment_for_user(
        db,
        rfp_id,
        user_id,
    )

    if (
        duplicate
        and (
            existing_assignment is None
            or duplicate.id != existing_assignment.id
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already assigned to this RFP",
        )

    due_date = data.get(
        "due_date",
        existing_assignment.due_date
        if existing_assignment
        else None,
    )

    if (
        due_date is not None
        and due_date > rfp.submission_deadline
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Assignment due date cannot be after "
                "the RFP submission deadline"
            ),
        )


def create_rfp_assignment(
    db: Session,
    data: dict[str, Any],
) -> RFPAssignment:
    validate_rfp_assignment(
        db,
        data,
    )

    try:
        assignment = create_record(
            db,
            RFPAssignment,
            data,
        )

        rfp = require_rfp(
            db,
            assignment.rfp_id,
        )

        if rfp.rfp_status in {
            "RECEIVED",
            "EVALUATED",
        }:
            rfp.rfp_status = "IN_PROGRESS"
            db.commit()

        return assignment

    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_rfp_assignments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[RFPAssignment]:
    return get_all_records(
        db,
        RFPAssignment,
        skip,
        limit,
    )


def get_rfp_assignment(
    db: Session,
    assignment_id: int,
) -> RFPAssignment:
    return require_rfp_assignment(
        db,
        assignment_id,
    )


def get_assignments_for_rfp(
    db: Session,
    rfp_id: int,
) -> list[RFPAssignment]:
    require_rfp(
        db,
        rfp_id,
    )

    return get_assignments_by_rfp(
        db,
        rfp_id,
    )


def get_assignments_for_user(
    db: Session,
    user_id: int,
) -> list[RFPAssignment]:
    require_user(
        db,
        user_id,
    )

    return get_assignments_by_user(
        db,
        user_id,
    )


def update_rfp_assignment(
    db: Session,
    assignment_id: int,
    data: dict[str, Any],
) -> RFPAssignment:
    assignment = require_rfp_assignment(
        db,
        assignment_id,
    )

    validate_rfp_assignment(
        db,
        data,
        existing_assignment=assignment,
    )

    try:
        return update_record(
            db,
            assignment,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def delete_rfp_assignment(
    db: Session,
    assignment_id: int,
) -> None:
    assignment = require_rfp_assignment(
        db,
        assignment_id,
    )

    try:
        delete_record(
            db,
            assignment,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )