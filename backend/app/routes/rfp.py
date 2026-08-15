from fastapi import (
    APIRouter,
    Depends,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.rfp import (
    BidEvaluationCreate,
    BidEvaluationPatch,
    BidEvaluationPut,
    BidEvaluationResponse,
    RFPAssignmentCreate,
    RFPAssignmentPatch,
    RFPAssignmentPut,
    RFPAssignmentResponse,
    RFPCreate,
    RFPPatch,
    RFPPut,
    RFPResponse,
)
from app.services.rfp_service import (
    create_bid_evaluation,
    create_rfp,
    create_rfp_assignment,
    delete_bid_evaluation,
    delete_rfp,
    delete_rfp_assignment,
    get_assignments_for_rfp,
    get_assignments_for_user,
    get_bid_evaluation,
    get_bid_evaluations,
    get_latest_rfp_evaluation,
    get_rfp,
    get_rfp_assignment,
    get_rfp_assignments,
    get_rfp_evaluations,
    get_rfps,
    get_rfps_for_bid_decision,
    get_rfps_for_status,
    update_bid_evaluation,
    update_rfp,
    update_rfp_assignment,
)


router = APIRouter(
    prefix="/api/rfp",
    tags=["RFP / Bid Management"],
    dependencies=[Depends(get_current_user)],
)


# =========================================================
# RFP routes
# =========================================================


@router.post(
    "/rfps",
    response_model=RFPResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_rfp_api(
    payload: RFPCreate,
    db: Session = Depends(get_db),
):
    return create_rfp(
        db,
        payload.model_dump(),
    )


@router.get(
    "/rfps",
    response_model=list[RFPResponse],
)
def get_rfps_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_rfps(
        db,
        skip,
        limit,
    )


@router.get(
    "/rfps/status/{rfp_status}",
    response_model=list[RFPResponse],
)
def get_rfps_by_status_api(
    rfp_status: str,
    db: Session = Depends(get_db),
):
    return get_rfps_for_status(
        db,
        rfp_status,
    )


@router.get(
    "/rfps/bid-decision/{bid_decision}",
    response_model=list[RFPResponse],
)
def get_rfps_by_bid_decision_api(
    bid_decision: str,
    db: Session = Depends(get_db),
):
    return get_rfps_for_bid_decision(
        db,
        bid_decision,
    )


@router.get(
    "/rfps/{rfp_id}",
    response_model=RFPResponse,
)
def get_rfp_api(
    rfp_id: int,
    db: Session = Depends(get_db),
):
    return get_rfp(
        db,
        rfp_id,
    )


@router.put(
    "/rfps/{rfp_id}",
    response_model=RFPResponse,
)
def replace_rfp_api(
    rfp_id: int,
    payload: RFPPut,
    db: Session = Depends(get_db),
):
    return update_rfp(
        db,
        rfp_id,
        payload.model_dump(),
    )


@router.patch(
    "/rfps/{rfp_id}",
    response_model=RFPResponse,
)
def patch_rfp_api(
    rfp_id: int,
    payload: RFPPatch,
    db: Session = Depends(get_db),
):
    return update_rfp(
        db,
        rfp_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/rfps/{rfp_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_rfp_api(
    rfp_id: int,
    db: Session = Depends(get_db),
):
    delete_rfp(
        db,
        rfp_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Bid Evaluation routes
# =========================================================


@router.post(
    "/bid-evaluations",
    response_model=BidEvaluationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bid_evaluation_api(
    payload: BidEvaluationCreate,
    db: Session = Depends(get_db),
):
    return create_bid_evaluation(
        db,
        payload.model_dump(),
    )


@router.get(
    "/bid-evaluations",
    response_model=list[BidEvaluationResponse],
)
def get_bid_evaluations_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_bid_evaluations(
        db,
        skip,
        limit,
    )


@router.get(
    "/bid-evaluations/{evaluation_id}",
    response_model=BidEvaluationResponse,
)
def get_bid_evaluation_api(
    evaluation_id: int,
    db: Session = Depends(get_db),
):
    return get_bid_evaluation(
        db,
        evaluation_id,
    )


@router.get(
    "/rfps/{rfp_id}/evaluations",
    response_model=list[BidEvaluationResponse],
)
def get_rfp_evaluations_api(
    rfp_id: int,
    db: Session = Depends(get_db),
):
    return get_rfp_evaluations(
        db,
        rfp_id,
    )


@router.get(
    "/rfps/{rfp_id}/evaluations/latest",
    response_model=BidEvaluationResponse,
)
def get_latest_rfp_evaluation_api(
    rfp_id: int,
    db: Session = Depends(get_db),
):
    return get_latest_rfp_evaluation(
        db,
        rfp_id,
    )


@router.put(
    "/bid-evaluations/{evaluation_id}",
    response_model=BidEvaluationResponse,
)
def replace_bid_evaluation_api(
    evaluation_id: int,
    payload: BidEvaluationPut,
    db: Session = Depends(get_db),
):
    return update_bid_evaluation(
        db,
        evaluation_id,
        payload.model_dump(),
    )


@router.patch(
    "/bid-evaluations/{evaluation_id}",
    response_model=BidEvaluationResponse,
)
def patch_bid_evaluation_api(
    evaluation_id: int,
    payload: BidEvaluationPatch,
    db: Session = Depends(get_db),
):
    return update_bid_evaluation(
        db,
        evaluation_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/bid-evaluations/{evaluation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_bid_evaluation_api(
    evaluation_id: int,
    db: Session = Depends(get_db),
):
    delete_bid_evaluation(
        db,
        evaluation_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# RFP Assignment routes
# =========================================================


@router.post(
    "/assignments",
    response_model=RFPAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_rfp_assignment_api(
    payload: RFPAssignmentCreate,
    db: Session = Depends(get_db),
):
    return create_rfp_assignment(
        db,
        payload.model_dump(),
    )


@router.get(
    "/assignments",
    response_model=list[RFPAssignmentResponse],
)
def get_rfp_assignments_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_rfp_assignments(
        db,
        skip,
        limit,
    )


@router.get(
    "/assignments/{assignment_id}",
    response_model=RFPAssignmentResponse,
)
def get_rfp_assignment_api(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    return get_rfp_assignment(
        db,
        assignment_id,
    )


@router.get(
    "/rfps/{rfp_id}/assignments",
    response_model=list[RFPAssignmentResponse],
)
def get_assignments_for_rfp_api(
    rfp_id: int,
    db: Session = Depends(get_db),
):
    return get_assignments_for_rfp(
        db,
        rfp_id,
    )


@router.get(
    "/users/{user_id}/assignments",
    response_model=list[RFPAssignmentResponse],
)
def get_assignments_for_user_api(
    user_id: int,
    db: Session = Depends(get_db),
):
    return get_assignments_for_user(
        db,
        user_id,
    )


@router.put(
    "/assignments/{assignment_id}",
    response_model=RFPAssignmentResponse,
)
def replace_rfp_assignment_api(
    assignment_id: int,
    payload: RFPAssignmentPut,
    db: Session = Depends(get_db),
):
    return update_rfp_assignment(
        db,
        assignment_id,
        payload.model_dump(),
    )


@router.patch(
    "/assignments/{assignment_id}",
    response_model=RFPAssignmentResponse,
)
def patch_rfp_assignment_api(
    assignment_id: int,
    payload: RFPAssignmentPatch,
    db: Session = Depends(get_db),
):
    return update_rfp_assignment(
        db,
        assignment_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_rfp_assignment_api(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    delete_rfp_assignment(
        db,
        assignment_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )