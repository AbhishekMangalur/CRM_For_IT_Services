from datetime import date
from pathlib import PurePath
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.presale import (
    EstimationCreate,
    EstimationApprovalRequest,
    EstimationApprovalResponse,
    EstimationPatch,
    EstimationPut,
    EstimationResponse,
    EstimationRejectionRequest,
    ProposalCreate,
    ProposalPatch,
    ProposalPut,
    ProposalResponse,
    ResourceRequirementCreate,
    ResourceRequirementPatch,
    ResourceRequirementPut,
    ResourceRequirementResponse,
    SolutionCreate,
    SolutionPatch,
    SolutionPut,
    SolutionResponse,
)
from app.services.presale_service import (
    approve_estimation,
    approve_proposal,
    create_estimation,
    create_proposal,
    create_resource_requirement,
    create_solution,
    delete_estimation,
    delete_proposal,
    delete_resource_requirement,
    delete_solution,
    get_estimation,
    get_estimations,
    get_proposal,
    get_proposals,
    get_resource_requirement,
    get_resource_requirements,
    get_solution,
    get_solutions,
    reject_estimation,
    reject_proposal,
    submit_proposal,
    update_estimation,
    update_proposal,
    update_resource_requirement,
    update_solution,
)


router = APIRouter(
    prefix="/api/presale",
    tags=["Presale"],
    dependencies=[Depends(get_current_user)],
)


# =========================================================
# Solution routes
# =========================================================


@router.post(
    "/solutions",
    response_model=SolutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_solution_api(
    payload: SolutionCreate,
    db: Session = Depends(get_db),
):
    return create_solution(
        db,
        payload.model_dump(),
    )


@router.get(
    "/solutions",
    response_model=list[SolutionResponse],
)
def get_solutions_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_solutions(
        db,
        skip,
        limit,
    )


@router.get(
    "/solutions/{solution_id}",
    response_model=SolutionResponse,
)
def get_solution_api(
    solution_id: int,
    db: Session = Depends(get_db),
):
    return get_solution(
        db,
        solution_id,
    )


@router.put(
    "/solutions/{solution_id}",
    response_model=SolutionResponse,
)
def replace_solution_api(
    solution_id: int,
    payload: SolutionPut,
    db: Session = Depends(get_db),
):
    return update_solution(
        db,
        solution_id,
        payload.model_dump(),
    )


@router.patch(
    "/solutions/{solution_id}",
    response_model=SolutionResponse,
)
def patch_solution_api(
    solution_id: int,
    payload: SolutionPatch,
    db: Session = Depends(get_db),
):
    return update_solution(
        db,
        solution_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/solutions/{solution_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_solution_api(
    solution_id: int,
    db: Session = Depends(get_db),
):
    delete_solution(
        db,
        solution_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Estimation routes
# =========================================================


@router.post(
    "/estimations",
    response_model=EstimationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_estimation_api(
    payload: EstimationCreate,
    db: Session = Depends(get_db),
):
    return create_estimation(
        db,
        payload.model_dump(),
    )


@router.get(
    "/estimations",
    response_model=list[EstimationResponse],
)
def get_estimations_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_estimations(
        db,
        skip,
        limit,
    )


@router.get(
    "/estimations/{estimation_id}",
    response_model=EstimationResponse,
)
def get_estimation_api(
    estimation_id: int,
    db: Session = Depends(get_db),
):
    return get_estimation(
        db,
        estimation_id,
    )


@router.put(
    "/estimations/{estimation_id}",
    response_model=EstimationResponse,
)
def replace_estimation_api(
    estimation_id: int,
    payload: EstimationPut,
    db: Session = Depends(get_db),
):
    return update_estimation(
        db,
        estimation_id,
        payload.model_dump(),
    )


@router.patch(
    "/estimations/{estimation_id}",
    response_model=EstimationResponse,
)
def patch_estimation_api(
    estimation_id: int,
    payload: EstimationPatch,
    db: Session = Depends(get_db),
):
    return update_estimation(
        db,
        estimation_id,
        payload.model_dump(exclude_unset=True),
    )


@router.post(
    "/estimations/{estimation_id}/approve",
    response_model=EstimationApprovalResponse,
)
def approve_estimation_api(
    estimation_id: int,
    payload: EstimationApprovalRequest,
    db: Session = Depends(get_db),
):
    return approve_estimation(
        db,
        estimation_id,
        payload.approved_by,
    )


@router.post(
    "/estimations/{estimation_id}/reject",
    response_model=EstimationResponse,
)
def reject_estimation_api(
    estimation_id: int,
    payload: EstimationRejectionRequest,
    db: Session = Depends(get_db),
):
    if payload.estimation_id != estimation_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Estimation ID in the request body must match the path",
        )

    return reject_estimation(
        db,
        estimation_id,
        payload.approved_by,
        payload.rejection_reason,
    )


@router.delete(
    "/estimations/{estimation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_estimation_api(
    estimation_id: int,
    db: Session = Depends(get_db),
):
    delete_estimation(
        db,
        estimation_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Resource requirement routes
# =========================================================


@router.post(
    "/resource-requirements",
    response_model=ResourceRequirementResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/resource-requirements",
    response_model=ResourceRequirementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_resource_requirement_api(
    payload: ResourceRequirementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_resource_requirement(
        db=db,
        data=payload.model_dump(),
        requested_by=current_user.id,
    )


@router.get(
    "/resource-requirements",
    response_model=list[ResourceRequirementResponse],
)
def get_resource_requirements_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_resource_requirements(
        db,
        skip,
        limit,
    )


@router.get(
    "/resource-requirements/{requirement_id}",
    response_model=ResourceRequirementResponse,
)
def get_resource_requirement_api(
    requirement_id: int,
    db: Session = Depends(get_db),
):
    return get_resource_requirement(
        db,
        requirement_id,
    )


@router.put(
    "/resource-requirements/{requirement_id}",
    response_model=ResourceRequirementResponse,
)
def replace_resource_requirement_api(
    requirement_id: int,
    payload: ResourceRequirementPut,
    db: Session = Depends(get_db),
):
    return update_resource_requirement(
        db,
        requirement_id,
        payload.model_dump(),
    )


@router.patch(
    "/resource-requirements/{requirement_id}",
    response_model=ResourceRequirementResponse,
)
def patch_resource_requirement_api(
    requirement_id: int,
    payload: ResourceRequirementPatch,
    db: Session = Depends(get_db),
):
    return update_resource_requirement(
        db,
        requirement_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/resource-requirements/{requirement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resource_requirement_api(
    requirement_id: int,
    db: Session = Depends(get_db),
):
    delete_resource_requirement(
        db,
        requirement_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Proposal routes
# =========================================================


@router.post(
    "/proposals",
    response_model=ProposalResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_proposal_api(
    solution_id: int = Form(...),
    proposal_title: str = Form(...),
    version: str = Form("1.0"),
    proposal_status: str = Form("DRAFT"),
    approval_status: str = Form("PENDING"),
    submission_date: date | None = Form(None),
    remarks: str | None = Form(None),
    sow_document: UploadFile = File(...),
    proposal_document: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    async def read_pdf(file: UploadFile, label: str) -> tuple[bytes, str]:
        filename = PurePath(file.filename or "document.pdf").name
        content = await file.read(10 * 1024 * 1024 + 1)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"{label} must be 10 MB or smaller",
            )
        if file.content_type != "application/pdf" or not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{label} must be a valid PDF file",
            )
        return content, filename

    sow_content, sow_filename = await read_pdf(sow_document, "SOW document")
    proposal_content, proposal_filename = await read_pdf(
        proposal_document, "Proposal document"
    )

    payload = ProposalCreate(
        solution_id=solution_id,
        proposal_title=proposal_title,
        version=version,
        submission_date=submission_date,
        proposal_status=proposal_status,
        approval_status=approval_status,
        remarks=remarks,
    )
    return create_proposal(
        db,
        payload.model_dump(),
        sow_document=sow_content,
        sow_filename=sow_filename,
        proposal_document=proposal_content,
        proposal_filename=proposal_filename,
    )


def proposal_pdf_response(content: bytes | None, filename: str | None) -> Response:
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal document not found",
        )
    safe_filename = filename or "document.pdf"
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename*=UTF-8''{quote(safe_filename)}"
        },
    )


@router.put("/proposals/{proposal_id}/documents", response_model=ProposalResponse)
async def replace_proposal_documents_api(
    proposal_id: int,
    sow_document: UploadFile = File(...),
    proposal_document: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    async def read_pdf(file: UploadFile, label: str) -> tuple[bytes, str]:
        filename = PurePath(file.filename or "document.pdf").name
        content = await file.read(10 * 1024 * 1024 + 1)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"{label} must be 10 MB or smaller",
            )
        if file.content_type != "application/pdf" or not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{label} must be a valid PDF file",
            )
        return content, filename

    proposal = get_proposal(db, proposal_id)
    sow_content, sow_filename = await read_pdf(sow_document, "SOW document")
    proposal_content, proposal_filename = await read_pdf(
        proposal_document, "Proposal document"
    )
    proposal.sow_document_content = sow_content
    proposal.sow_document_filename = sow_filename
    proposal.proposal_document_content = proposal_content
    proposal.proposal_document_filename = proposal_filename
    proposal.sow_document_url = f"/api/presale/proposals/{proposal.id}/sow-document"
    proposal.proposal_document_url = (
        f"/api/presale/proposals/{proposal.id}/proposal-document"
    )
    db.commit()
    db.refresh(proposal)
    return proposal


@router.get("/proposals/{proposal_id}/sow-document")
def get_sow_document_api(
    proposal_id: int,
    db: Session = Depends(get_db),
):
    proposal = get_proposal(db, proposal_id)
    return proposal_pdf_response(
        proposal.sow_document_content, proposal.sow_document_filename
    )


@router.get("/proposals/{proposal_id}/proposal-document")
def get_proposal_document_api(
    proposal_id: int,
    db: Session = Depends(get_db),
):
    proposal = get_proposal(db, proposal_id)
    return proposal_pdf_response(
        proposal.proposal_document_content,
        proposal.proposal_document_filename,
    )


@router.get(
    "/proposals",
    response_model=list[ProposalResponse],
)
def get_proposals_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_proposals(
        db,
        skip,
        limit,
    )


@router.get(
    "/proposals/{proposal_id}",
    response_model=ProposalResponse,
)
def get_proposal_api(
    proposal_id: int,
    db: Session = Depends(get_db),
):
    return get_proposal(
        db,
        proposal_id,
    )


@router.put(
    "/proposals/{proposal_id}",
    response_model=ProposalResponse,
)
def replace_proposal_api(
    proposal_id: int,
    payload: ProposalPut,
    db: Session = Depends(get_db),
):
    return update_proposal(
        db,
        proposal_id,
        payload.model_dump(),
    )


@router.patch(
    "/proposals/{proposal_id}",
    response_model=ProposalResponse,
)
def patch_proposal_api(
    proposal_id: int,
    payload: ProposalPatch,
    db: Session = Depends(get_db),
):
    return update_proposal(
        db,
        proposal_id,
        payload.model_dump(exclude_unset=True),
    )


@router.patch(
    "/proposals/{proposal_id}/submit",
    response_model=ProposalResponse,
)
def submit_proposal_api(
    proposal_id: int,
    db: Session = Depends(get_db),
):
    return submit_proposal(
        db,
        proposal_id,
    )


@router.patch(
    "/proposals/{proposal_id}/approve",
    response_model=ProposalResponse,
)
def approve_proposal_api(
    proposal_id: int,
    db: Session = Depends(get_db),
):
    return approve_proposal(
        db,
        proposal_id,
    )


@router.patch(
    "/proposals/{proposal_id}/reject",
    response_model=ProposalResponse,
)
def reject_proposal_api(
    proposal_id: int,
    remarks: str,
    db: Session = Depends(get_db),
):
    return reject_proposal(
        db,
        proposal_id,
        remarks,
    )


@router.delete(
    "/proposals/{proposal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_proposal_api(
    proposal_id: int,
    db: Session = Depends(get_db),
):
    delete_proposal(
        db,
        proposal_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )
