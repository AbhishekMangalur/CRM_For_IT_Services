from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.executive import FinancialSummaryResponse
from app.services.financial_import_service import (
    get_financial_summary,
    import_financial_actuals_csv,
)


router = APIRouter(
    prefix="/api/executive",
    tags=["Executive - Financial Import"],
    dependencies=[
        Depends(get_current_user)
    ],
)


@router.get(
    "/financials/summary",
    response_model=FinancialSummaryResponse,
)
def get_financial_summary_api(
    db: Session = Depends(get_db),
):
    return get_financial_summary(db)


@router.post(
    "/financials/import",
)
def import_financial_actuals_api(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return import_financial_actuals_csv(
        db=db,
        file=file,
    )
