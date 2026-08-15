from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.alliance import (
    Partner,
    PartnerCertification,
    PartnerDealRegistration,
    PartnerInfluencedOpportunity,
)
from app.models.resource_manager import Employee
from app.models.sale import Opportunity
from app.models.user import User
from app.repositories.alliance_repository import (
    create_record,
    delete_record,
    get_all_records,
    get_certifications_by_employee,
    get_certifications_by_partner,
    get_deal_registration_by_reference,
    get_deal_registrations_by_partner,
    get_influenced_opportunities_by_partner,
    get_partner_by_name,
    get_partner_influence,
    get_record_by_id,
    update_record,
)


# =========================================================
# Common helpers
# =========================================================


def handle_integrity_error(
    db: Session,
    error: IntegrityError,
) -> None:
    db.rollback()

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="The operation conflicts with existing database records",
    ) from error


def require_user(
    db: Session,
    user_id: int,
) -> User:
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {user_id} is inactive",
        )

    return user


def require_opportunity(
    db: Session,
    opportunity_id: int,
) -> Opportunity:
    opportunity = db.get(
        Opportunity,
        opportunity_id,
    )

    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found",
        )

    return opportunity


def require_employee(
    db: Session,
    employee_id: int,
) -> Employee:
    employee = db.get(
        Employee,
        employee_id,
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee is inactive",
        )

    return employee


# =========================================================
# Partner service
# =========================================================


def require_partner(
    db: Session,
    partner_id: int,
) -> Partner:
    partner = get_record_by_id(
        db,
        Partner,
        partner_id,
    )

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner not found",
        )

    return partner


def normalize_partner_data(
    data: dict[str, Any],
) -> dict[str, Any]:
    if "name" in data and data["name"]:
        data["name"] = data["name"].strip()

    if (
        "contact_email" in data
        and data["contact_email"] is not None
    ):
        data["contact_email"] = (
            data["contact_email"].strip().lower()
        )

    return data


def validate_partner_uniqueness(
    db: Session,
    data: dict[str, Any],
    existing_partner: Partner | None = None,
) -> None:
    name = data.get("name")

    if name is None:
        return

    existing = get_partner_by_name(
        db,
        name.strip(),
    )

    if (
        existing
        and (
            existing_partner is None
            or existing.id != existing_partner.id
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Partner already exists",
        )


def create_partner(
    db: Session,
    data: dict[str, Any],
) -> Partner:
    data = normalize_partner_data(data)

    validate_partner_uniqueness(
        db,
        data,
    )

    try:
        return create_record(
            db,
            Partner,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_partners(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Partner]:
    return get_all_records(
        db,
        Partner,
        skip,
        limit,
    )


def get_partner(
    db: Session,
    partner_id: int,
) -> Partner:
    return require_partner(
        db,
        partner_id,
    )


def update_partner(
    db: Session,
    partner_id: int,
    data: dict[str, Any],
) -> Partner:
    partner = require_partner(
        db,
        partner_id,
    )

    data = normalize_partner_data(data)

    validate_partner_uniqueness(
        db,
        data,
        existing_partner=partner,
    )

    try:
        return update_record(
            db,
            partner,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def delete_partner(
    db: Session,
    partner_id: int,
) -> None:
    partner = require_partner(
        db,
        partner_id,
    )

    try:
        delete_record(
            db,
            partner,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


# =========================================================
# Partner Deal Registration service
# =========================================================


def require_deal_registration(
    db: Session,
    registration_id: int,
) -> PartnerDealRegistration:
    registration = get_record_by_id(
        db,
        PartnerDealRegistration,
        registration_id,
    )

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner deal registration not found",
        )

    return registration


def validate_deal_registration(
    db: Session,
    data: dict[str, Any],
    existing_registration: PartnerDealRegistration | None = None,
) -> None:
    partner_id = data.get(
        "partner_id",
        existing_registration.partner_id
        if existing_registration
        else None,
    )

    opportunity_id = data.get(
        "opportunity_id",
        existing_registration.opportunity_id
        if existing_registration
        else None,
    )

    registered_by = data.get(
        "registered_by",
        existing_registration.registered_by
        if existing_registration
        else None,
    )

    if partner_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="partner_id is required",
        )

    partner = require_partner(
        db,
        partner_id,
    )

    if not partner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot register a deal with an inactive partner",
        )

    if opportunity_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="opportunity_id is required",
        )

    require_opportunity(
        db,
        opportunity_id,
    )

    if registered_by is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="registered_by is required",
        )

    require_user(
        db,
        registered_by,
    )

    registration_reference = data.get(
        "registration_reference",
        existing_registration.registration_reference
        if existing_registration
        else None,
    )

    if registration_reference:
        existing = get_deal_registration_by_reference(
            db,
            registration_reference,
        )

        if (
            existing
            and (
                existing_registration is None
                or existing.id != existing_registration.id
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Registration reference already exists",
            )

    registered_on = data.get(
        "registered_on",
        existing_registration.registered_on
        if existing_registration
        else None,
    )

    expiry_date = data.get(
        "expiry_date",
        existing_registration.expiry_date
        if existing_registration
        else None,
    )

    if (
        registered_on is not None
        and expiry_date is not None
        and expiry_date < registered_on
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expiry_date cannot be before registered_on",
        )


def create_deal_registration(
    db: Session,
    data: dict[str, Any],
) -> PartnerDealRegistration:
    validate_deal_registration(
        db,
        data,
    )

    try:
        return create_record(
            db,
            PartnerDealRegistration,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_deal_registrations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[PartnerDealRegistration]:
    return get_all_records(
        db,
        PartnerDealRegistration,
        skip,
        limit,
    )


def get_deal_registration(
    db: Session,
    registration_id: int,
) -> PartnerDealRegistration:
    return require_deal_registration(
        db,
        registration_id,
    )


def get_partner_deal_registrations(
    db: Session,
    partner_id: int,
) -> list[PartnerDealRegistration]:
    require_partner(
        db,
        partner_id,
    )

    return get_deal_registrations_by_partner(
        db,
        partner_id,
    )


def update_deal_registration(
    db: Session,
    registration_id: int,
    data: dict[str, Any],
) -> PartnerDealRegistration:
    registration = require_deal_registration(
        db,
        registration_id,
    )

    validate_deal_registration(
        db,
        data,
        existing_registration=registration,
    )

    try:
        return update_record(
            db,
            registration,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def delete_deal_registration(
    db: Session,
    registration_id: int,
) -> None:
    registration = require_deal_registration(
        db,
        registration_id,
    )

    try:
        delete_record(
            db,
            registration,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


# =========================================================
# Partner Influenced Opportunity service
# =========================================================


def require_partner_influence(
    db: Session,
    influence_id: int,
) -> PartnerInfluencedOpportunity:
    influence = get_record_by_id(
        db,
        PartnerInfluencedOpportunity,
        influence_id,
    )

    if not influence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner influenced opportunity not found",
        )

    return influence


def validate_partner_influence(
    db: Session,
    data: dict[str, Any],
    existing_influence: PartnerInfluencedOpportunity | None = None,
) -> None:
    partner_id = data.get(
        "partner_id",
        existing_influence.partner_id
        if existing_influence
        else None,
    )

    opportunity_id = data.get(
        "opportunity_id",
        existing_influence.opportunity_id
        if existing_influence
        else None,
    )

    if partner_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="partner_id is required",
        )

    partner = require_partner(
        db,
        partner_id,
    )

    if not partner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partner is inactive",
        )

    if opportunity_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="opportunity_id is required",
        )

    opportunity = require_opportunity(
        db,
        opportunity_id,
    )

    duplicate = get_partner_influence(
        db,
        partner_id,
        opportunity_id,
    )

    if (
        duplicate
        and (
            existing_influence is None
            or duplicate.id != existing_influence.id
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This partner is already linked "
                "to the opportunity"
            ),
        )

    influenced_value = data.get("influenced_value")

    if influenced_value is None and existing_influence is None:
        data["influenced_value"] = opportunity.deal_value


def create_partner_influence(
    db: Session,
    data: dict[str, Any],
) -> PartnerInfluencedOpportunity:
    validate_partner_influence(
        db,
        data,
    )

    try:
        return create_record(
            db,
            PartnerInfluencedOpportunity,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_partner_influences(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[PartnerInfluencedOpportunity]:
    return get_all_records(
        db,
        PartnerInfluencedOpportunity,
        skip,
        limit,
    )


def get_partner_influence_by_id(
    db: Session,
    influence_id: int,
) -> PartnerInfluencedOpportunity:
    return require_partner_influence(
        db,
        influence_id,
    )


def get_influences_for_partner(
    db: Session,
    partner_id: int,
) -> list[PartnerInfluencedOpportunity]:
    require_partner(
        db,
        partner_id,
    )

    return get_influenced_opportunities_by_partner(
        db,
        partner_id,
    )


def update_partner_influence(
    db: Session,
    influence_id: int,
    data: dict[str, Any],
) -> PartnerInfluencedOpportunity:
    influence = require_partner_influence(
        db,
        influence_id,
    )

    validate_partner_influence(
        db,
        data,
        existing_influence=influence,
    )

    try:
        return update_record(
            db,
            influence,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def delete_partner_influence(
    db: Session,
    influence_id: int,
) -> None:
    influence = require_partner_influence(
        db,
        influence_id,
    )

    try:
        delete_record(
            db,
            influence,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


# =========================================================
# Partner Certification service
# =========================================================


def require_partner_certification(
    db: Session,
    certification_id: int,
) -> PartnerCertification:
    certification = get_record_by_id(
        db,
        PartnerCertification,
        certification_id,
    )

    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partner certification not found",
        )

    return certification


def validate_partner_certification(
    db: Session,
    data: dict[str, Any],
    existing_certification: PartnerCertification | None = None,
) -> None:
    partner_id = data.get(
        "partner_id",
        existing_certification.partner_id
        if existing_certification
        else None,
    )

    employee_id = data.get(
        "employee_id",
        existing_certification.employee_id
        if existing_certification
        else None,
    )

    if partner_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="partner_id is required",
        )

    partner = require_partner(
        db,
        partner_id,
    )

    if not partner.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partner is inactive",
        )

    if employee_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="employee_id is required",
        )

    require_employee(
        db,
        employee_id,
    )

    issued_date = data.get(
        "issued_date",
        existing_certification.issued_date
        if existing_certification
        else None,
    )

    expiry_date = data.get(
        "expiry_date",
        existing_certification.expiry_date
        if existing_certification
        else None,
    )

    if (
        issued_date is not None
        and expiry_date is not None
        and expiry_date < issued_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expiry_date cannot be before issued_date",
        )


def create_partner_certification(
    db: Session,
    data: dict[str, Any],
) -> PartnerCertification:
    validate_partner_certification(
        db,
        data,
    )

    try:
        return create_record(
            db,
            PartnerCertification,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def get_partner_certifications(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[PartnerCertification]:
    return get_all_records(
        db,
        PartnerCertification,
        skip,
        limit,
    )


def get_partner_certification(
    db: Session,
    certification_id: int,
) -> PartnerCertification:
    return require_partner_certification(
        db,
        certification_id,
    )


def get_certifications_for_partner(
    db: Session,
    partner_id: int,
) -> list[PartnerCertification]:
    require_partner(
        db,
        partner_id,
    )

    return get_certifications_by_partner(
        db,
        partner_id,
    )


def get_certifications_for_employee(
    db: Session,
    employee_id: int,
) -> list[PartnerCertification]:
    require_employee(
        db,
        employee_id,
    )

    return get_certifications_by_employee(
        db,
        employee_id,
    )


def update_partner_certification(
    db: Session,
    certification_id: int,
    data: dict[str, Any],
) -> PartnerCertification:
    certification = require_partner_certification(
        db,
        certification_id,
    )

    validate_partner_certification(
        db,
        data,
        existing_certification=certification,
    )

    try:
        return update_record(
            db,
            certification,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )


def delete_partner_certification(
    db: Session,
    certification_id: int,
) -> None:
    certification = require_partner_certification(
        db,
        certification_id,
    )

    try:
        delete_record(
            db,
            certification,
        )
    except IntegrityError as error:
        handle_integrity_error(
            db,
            error,
        )