from fastapi import (
    APIRouter,
    Depends,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.blended_rate import (
    BlendedRateCalculateRequest,
    BlendedRateCalculateResponse,
)
from app.services.blended_rate_service import (
    calculate_and_save_blended_rate,
    delete_blended_rates,
    get_blended_rates,
)


router = APIRouter(
    prefix="/api/presale/blended-rate",
    tags=["Presales - Blended Rate"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/calculate",
    response_model=BlendedRateCalculateResponse,
    status_code=status.HTTP_201_CREATED,
)
def calculate_blended_rate_api(
    payload: BlendedRateCalculateRequest,
    db: Session = Depends(get_db),
):
    return calculate_and_save_blended_rate(
        db,
        payload,
    )


@router.get(
    "/{estimation_id}",
    response_model=BlendedRateCalculateResponse,
)
def get_blended_rate_api(
    estimation_id: int,
    db: Session = Depends(get_db),
):
    return get_blended_rates(
        db,
        estimation_id,
    )


@router.delete(
    "/{estimation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_blended_rate_api(
    estimation_id: int,
    db: Session = Depends(get_db),
):
    delete_blended_rates(
        db,
        estimation_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )