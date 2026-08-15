from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.resource_match import ResourceMatchResponse
from app.services.resource_match_service import get_matching_resources


router = APIRouter(
    prefix="/api/resource-manager",
    tags=["Resource Matching"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/resource-requests/{request_id}/matches",
    response_model=list[ResourceMatchResponse],
)
def get_resource_matches_api(
    request_id: int,
    db: Session = Depends(get_db),
):
    return get_matching_resources(
        db,
        request_id,
    )