from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.services.customer_health_import_service import (
    import_customer_health_csv,
)


router = APIRouter(
    prefix="/api/account-director",
    tags=[
        "Account Director - Customer Health Import"
    ],
    dependencies=[
        Depends(get_current_user)
    ],
)


@router.post(
    "/customer-health/import",
)
def import_customer_health_api(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return import_customer_health_csv(
        db=db,
        file=file,
    )