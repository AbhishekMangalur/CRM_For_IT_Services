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
from app.models.user import User
from app.schemas.sale import (
    LeadCreate,
    LeadPatch,
    LeadPut,
    LeadResponse,
    OpportunityCreate,
    OpportunityPatch,
    OpportunityPut,
    OpportunityResponse,
    SalesActivityCreate,
    SalesActivityPatch,
    SalesActivityPut,
    SalesActivityResponse,
)
from app.services.sales_service import (
    create_lead,
    create_opportunity,
    create_sales_activity,
    delete_lead,
    delete_opportunity,
    delete_sales_activity,
    get_lead,
    get_leads,
    get_opportunities,
    get_opportunity,
    get_sales_activities,
    get_sales_activity,
    update_lead,
    update_opportunity,
    update_sales_activity,
)


router = APIRouter(
    prefix="/api/sales",
    tags=["Sales"],
    dependencies=[Depends(get_current_user)],
)


# =========================================================
# Lead routes
# =========================================================


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lead_api(
    payload: LeadCreate,
    db: Session = Depends(get_db),
):
    return create_lead(
        db,
        payload.model_dump(),
    )


@router.get(
    "/leads",
    response_model=list[LeadResponse],
)
def get_leads_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_leads(db, skip, limit)


@router.get(
    "/leads/{lead_id}",
    response_model=LeadResponse,
)
def get_lead_api(
    lead_id: int,
    db: Session = Depends(get_db),
):
    return get_lead(db, lead_id)


@router.put(
    "/leads/{lead_id}",
    response_model=LeadResponse,
)
def replace_lead_api(
    lead_id: int,
    payload: LeadPut,
    db: Session = Depends(get_db),
):
    return update_lead(
        db,
        lead_id,
        payload.model_dump(),
    )


@router.patch(
    "/leads/{lead_id}",
    response_model=LeadResponse,
)
def patch_lead_api(
    lead_id: int,
    payload: LeadPatch,
    db: Session = Depends(get_db),
):
    return update_lead(
        db,
        lead_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/leads/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_lead_api(
    lead_id: int,
    db: Session = Depends(get_db),
):
    delete_lead(db, lead_id)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Opportunity routes
# =========================================================


@router.post(
    "/opportunities",
    response_model=OpportunityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_opportunity_api(
    payload: OpportunityCreate,
    db: Session = Depends(get_db),
):
    return create_opportunity(
        db,
        payload.model_dump(),
    )


@router.get(
    "/opportunities",
    response_model=list[OpportunityResponse],
)
def get_opportunities_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_opportunities(db, skip, limit)


@router.get(
    "/opportunities/{opportunity_id}",
    response_model=OpportunityResponse,
)
def get_opportunity_api(
    opportunity_id: int,
    db: Session = Depends(get_db),
):
    return get_opportunity(db, opportunity_id)


@router.put(
    "/opportunities/{opportunity_id}",
    response_model=OpportunityResponse,
)
def replace_opportunity_api(
    opportunity_id: int,
    payload: OpportunityPut,
    db: Session = Depends(get_db),
):
    return update_opportunity(
        db,
        opportunity_id,
        payload.model_dump(),
    )


@router.patch(
    "/opportunities/{opportunity_id}",
    response_model=OpportunityResponse,
)
def patch_opportunity_api(
    opportunity_id: int,
    payload: OpportunityPatch,
    db: Session = Depends(get_db),
):
    return update_opportunity(
        db,
        opportunity_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/opportunities/{opportunity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_opportunity_api(
    opportunity_id: int,
    db: Session = Depends(get_db),
):
    delete_opportunity(db, opportunity_id)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Sales activity routes
# =========================================================


@router.post(
    "/activities",
    response_model=SalesActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_sales_activity_api(
    payload: SalesActivityCreate,
    db: Session = Depends(get_db),
):
    return create_sales_activity(
        db,
        payload.model_dump(),
    )


@router.get(
    "/activities",
    response_model=list[SalesActivityResponse],
)
def get_sales_activities_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_sales_activities(db, skip, limit)


@router.get(
    "/activities/{activity_id}",
    response_model=SalesActivityResponse,
)
def get_sales_activity_api(
    activity_id: int,
    db: Session = Depends(get_db),
):
    return get_sales_activity(db, activity_id)


@router.put(
    "/activities/{activity_id}",
    response_model=SalesActivityResponse,
)
def replace_sales_activity_api(
    activity_id: int,
    payload: SalesActivityPut,
    db: Session = Depends(get_db),
):
    return update_sales_activity(
        db,
        activity_id,
        payload.model_dump(),
    )


@router.patch(
    "/activities/{activity_id}",
    response_model=SalesActivityResponse,
)
def patch_sales_activity_api(
    activity_id: int,
    payload: SalesActivityPatch,
    db: Session = Depends(get_db),
):
    return update_sales_activity(
        db,
        activity_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/activities/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_sales_activity_api(
    activity_id: int,
    db: Session = Depends(get_db),
):
    delete_sales_activity(db, activity_id)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )