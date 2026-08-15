from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.alliance import (
    PartnerCreate,
    PartnerPatch,
    PartnerPut,
    PartnerResponse,
    PartnerDealRegistrationCreate,
    PartnerDealRegistrationPatch,
    PartnerDealRegistrationPut,
    PartnerDealRegistrationResponse,
    PartnerInfluencedOpportunityCreate,
    PartnerInfluencedOpportunityPatch,
    PartnerInfluencedOpportunityPut,
    PartnerInfluencedOpportunityResponse,
    PartnerCertificationCreate,
    PartnerCertificationPatch,
    PartnerCertificationPut,
    PartnerCertificationResponse,
)
from app.services.alliance_service import (
    create_partner,
    delete_partner,
    get_partner,
    get_partners,
    update_partner,
    create_deal_registration,
    delete_deal_registration,
    get_deal_registration,
    get_deal_registrations,
    get_partner_deal_registrations,
    update_deal_registration,
    create_partner_influence,
    delete_partner_influence,
    get_influences_for_partner,
    get_partner_influence_by_id,
    get_partner_influences,
    update_partner_influence,
    create_partner_certification,
    delete_partner_certification,
    get_certifications_for_employee,
    get_certifications_for_partner,
    get_partner_certification,
    get_partner_certifications,
    update_partner_certification,
)

router = APIRouter(
    prefix="/api/alliance",
    tags=["Alliance"],
    dependencies=[Depends(get_current_user)],
)


# =========================================================
# Partner
# =========================================================


@router.post(
    "/partners",
    response_model=PartnerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_partner_api(
    payload: PartnerCreate,
    db: Session = Depends(get_db),
):
    return create_partner(
        db,
        payload.model_dump(),
    )


@router.get(
    "/partners",
    response_model=list[PartnerResponse],
)
def get_partners_api(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return get_partners(
        db,
        skip,
        limit,
    )


@router.get(
    "/partners/{partner_id}",
    response_model=PartnerResponse,
)
def get_partner_api(
    partner_id: int,
    db: Session = Depends(get_db),
):
    return get_partner(
        db,
        partner_id,
    )


@router.put(
    "/partners/{partner_id}",
    response_model=PartnerResponse,
)
def replace_partner_api(
    partner_id: int,
    payload: PartnerPut,
    db: Session = Depends(get_db),
):
    return update_partner(
        db,
        partner_id,
        payload.model_dump(),
    )


@router.patch(
    "/partners/{partner_id}",
    response_model=PartnerResponse,
)
def patch_partner_api(
    partner_id: int,
    payload: PartnerPatch,
    db: Session = Depends(get_db),
):
    return update_partner(
        db,
        partner_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/partners/{partner_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_partner_api(
    partner_id: int,
    db: Session = Depends(get_db),
):
    delete_partner(
        db,
        partner_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )

# =========================================================
# Partner Deal Registration
# =========================================================


@router.post(
    "/deal-registrations",
    response_model=PartnerDealRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_deal_registration_api(
    payload: PartnerDealRegistrationCreate,
    db: Session = Depends(get_db),
):
    return create_deal_registration(
        db,
        payload.model_dump(),
    )


@router.get(
    "/deal-registrations",
    response_model=list[PartnerDealRegistrationResponse],
)
def get_deal_registrations_api(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return get_deal_registrations(
        db,
        skip,
        limit,
    )


@router.get(
    "/deal-registrations/{registration_id}",
    response_model=PartnerDealRegistrationResponse,
)
def get_deal_registration_api(
    registration_id: int,
    db: Session = Depends(get_db),
):
    return get_deal_registration(
        db,
        registration_id,
    )


@router.get(
    "/partners/{partner_id}/deal-registrations",
    response_model=list[PartnerDealRegistrationResponse],
)
def get_partner_deal_registrations_api(
    partner_id: int,
    db: Session = Depends(get_db),
):
    return get_partner_deal_registrations(
        db,
        partner_id,
    )


@router.put(
    "/deal-registrations/{registration_id}",
    response_model=PartnerDealRegistrationResponse,
)
def replace_deal_registration_api(
    registration_id: int,
    payload: PartnerDealRegistrationPut,
    db: Session = Depends(get_db),
):
    return update_deal_registration(
        db,
        registration_id,
        payload.model_dump(),
    )


@router.patch(
    "/deal-registrations/{registration_id}",
    response_model=PartnerDealRegistrationResponse,
)
def patch_deal_registration_api(
    registration_id: int,
    payload: PartnerDealRegistrationPatch,
    db: Session = Depends(get_db),
):
    return update_deal_registration(
        db,
        registration_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/deal-registrations/{registration_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_deal_registration_api(
    registration_id: int,
    db: Session = Depends(get_db),
):
    delete_deal_registration(
        db,
        registration_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )

# =========================================================
# Partner Influenced Opportunities
# =========================================================


@router.post(
    "/influenced-opportunities",
    response_model=PartnerInfluencedOpportunityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_partner_influence_api(
    payload: PartnerInfluencedOpportunityCreate,
    db: Session = Depends(get_db),
):
    return create_partner_influence(
        db,
        payload.model_dump(),
    )


@router.get(
    "/influenced-opportunities",
    response_model=list[PartnerInfluencedOpportunityResponse],
)
def get_partner_influences_api(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return get_partner_influences(
        db,
        skip,
        limit,
    )


@router.get(
    "/influenced-opportunities/{influence_id}",
    response_model=PartnerInfluencedOpportunityResponse,
)
def get_partner_influence_api(
    influence_id: int,
    db: Session = Depends(get_db),
):
    return get_partner_influence_by_id(
        db,
        influence_id,
    )


@router.get(
    "/partners/{partner_id}/influenced-opportunities",
    response_model=list[PartnerInfluencedOpportunityResponse],
)
def get_partner_influences_for_partner_api(
    partner_id: int,
    db: Session = Depends(get_db),
):
    return get_influences_for_partner(
        db,
        partner_id,
    )


@router.put(
    "/influenced-opportunities/{influence_id}",
    response_model=PartnerInfluencedOpportunityResponse,
)
def replace_partner_influence_api(
    influence_id: int,
    payload: PartnerInfluencedOpportunityPut,
    db: Session = Depends(get_db),
):
    return update_partner_influence(
        db,
        influence_id,
        payload.model_dump(),
    )


@router.patch(
    "/influenced-opportunities/{influence_id}",
    response_model=PartnerInfluencedOpportunityResponse,
)
def patch_partner_influence_api(
    influence_id: int,
    payload: PartnerInfluencedOpportunityPatch,
    db: Session = Depends(get_db),
):
    return update_partner_influence(
        db,
        influence_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/influenced-opportunities/{influence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_partner_influence_api(
    influence_id: int,
    db: Session = Depends(get_db),
):
    delete_partner_influence(
        db,
        influence_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )

# =========================================================
# Partner Certifications
# =========================================================


@router.post(
    "/certifications",
    response_model=PartnerCertificationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_partner_certification_api(
    payload: PartnerCertificationCreate,
    db: Session = Depends(get_db),
):
    return create_partner_certification(
        db,
        payload.model_dump(),
    )


@router.get(
    "/certifications",
    response_model=list[PartnerCertificationResponse],
)
def get_partner_certifications_api(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return get_partner_certifications(
        db,
        skip,
        limit,
    )


@router.get(
    "/certifications/{certification_id}",
    response_model=PartnerCertificationResponse,
)
def get_partner_certification_api(
    certification_id: int,
    db: Session = Depends(get_db),
):
    return get_partner_certification(
        db,
        certification_id,
    )


@router.get(
    "/partners/{partner_id}/certifications",
    response_model=list[PartnerCertificationResponse],
)
def get_partner_certifications_for_partner_api(
    partner_id: int,
    db: Session = Depends(get_db),
):
    return get_certifications_for_partner(
        db,
        partner_id,
    )


@router.get(
    "/employees/{employee_id}/certifications",
    response_model=list[PartnerCertificationResponse],
)
def get_partner_certifications_for_employee_api(
    employee_id: int,
    db: Session = Depends(get_db),
):
    return get_certifications_for_employee(
        db,
        employee_id,
    )


@router.put(
    "/certifications/{certification_id}",
    response_model=PartnerCertificationResponse,
)
def replace_partner_certification_api(
    certification_id: int,
    payload: PartnerCertificationPut,
    db: Session = Depends(get_db),
):
    return update_partner_certification(
        db,
        certification_id,
        payload.model_dump(),
    )


@router.patch(
    "/certifications/{certification_id}",
    response_model=PartnerCertificationResponse,
)
def patch_partner_certification_api(
    certification_id: int,
    payload: PartnerCertificationPatch,
    db: Session = Depends(get_db),
):
    return update_partner_certification(
        db,
        certification_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/certifications/{certification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_partner_certification_api(
    certification_id: int,
    db: Session = Depends(get_db),
):
    delete_partner_certification(
        db,
        certification_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )
