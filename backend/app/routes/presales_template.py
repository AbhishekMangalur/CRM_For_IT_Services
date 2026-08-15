from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.presales_template import (
    PresalesTemplateCreate,
    PresalesTemplateResponse,
    PresalesTemplateUpdate,
)
from app.services.presales_template_service import (
    create_template,
    delete_template,
    get_template,
    get_templates,
    update_template,
)


router = APIRouter(
    prefix="/api/presale/templates",
    tags=["Presales - Template Library"],
)


@router.post(
    "",
    response_model=PresalesTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_template_api(
    payload: PresalesTemplateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_template(
        db=db,
        payload=payload,
        created_by=current_user.id,
    )


@router.get(
    "",
    response_model=list[
        PresalesTemplateResponse
    ],
)
def get_templates_api(
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_templates(
        db=db,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{template_id}",
    response_model=PresalesTemplateResponse,
)
def get_template_api(
    template_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_template(
        db,
        template_id,
    )


@router.patch(
    "/{template_id}",
    response_model=PresalesTemplateResponse,
)
def update_template_api(
    template_id: int,
    payload: PresalesTemplateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return update_template(
        db=db,
        template_id=template_id,
        payload=payload,
    )


@router.delete(
    "/{template_id}",
)
def delete_template_api(
    template_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return delete_template(
        db,
        template_id,
    )