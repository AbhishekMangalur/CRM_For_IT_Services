from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.services.employee_import_service import (
    import_employees_from_csv,
)


router = APIRouter(
    prefix="/api/resource-manager",
    tags=["Resource Manager - Employee Import"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/employees/import",
)
def import_employees_api(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return import_employees_from_csv(
        db=db,
        file=file,
    )