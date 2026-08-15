from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alliance import (
    Partner,
    PartnerCertification,
    PartnerDealRegistration,
    PartnerInfluencedOpportunity,
)


AllianceModel = TypeVar(
    "AllianceModel",
    Partner,
    PartnerDealRegistration,
    PartnerInfluencedOpportunity,
    PartnerCertification,
)


def create_record(
    db: Session,
    model_class: type[AllianceModel],
    data: dict[str, Any],
) -> AllianceModel:
    record = model_class(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_record_by_id(
    db: Session,
    model_class: type[AllianceModel],
    record_id: int,
) -> AllianceModel | None:
    return db.get(
        model_class,
        record_id,
    )


def get_all_records(
    db: Session,
    model_class: type[AllianceModel],
    skip: int = 0,
    limit: int = 100,
) -> list[AllianceModel]:
    records = db.scalars(
        select(model_class)
        .order_by(model_class.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return list(records)


def update_record(
    db: Session,
    record: AllianceModel,
    data: dict[str, Any],
) -> AllianceModel:
    for field_name, value in data.items():
        setattr(
            record,
            field_name,
            value,
        )

    db.commit()
    db.refresh(record)

    return record


def delete_record(
    db: Session,
    record: AllianceModel,
) -> None:
    db.delete(record)
    db.commit()


# =========================================================
# Partner-specific queries
# =========================================================


def get_partner_by_name(
    db: Session,
    name: str,
) -> Partner | None:
    return db.scalar(
        select(Partner).where(
            Partner.name == name,
        )
    )


# =========================================================
# Deal registration queries
# =========================================================


def get_deal_registration_by_reference(
    db: Session,
    registration_reference: str,
) -> PartnerDealRegistration | None:
    return db.scalar(
        select(PartnerDealRegistration).where(
            PartnerDealRegistration.registration_reference
            == registration_reference
        )
    )


def get_deal_registrations_by_partner(
    db: Session,
    partner_id: int,
) -> list[PartnerDealRegistration]:
    records = db.scalars(
        select(PartnerDealRegistration)
        .where(
            PartnerDealRegistration.partner_id
            == partner_id
        )
        .order_by(
            PartnerDealRegistration.id.desc()
        )
    ).all()

    return list(records)


# =========================================================
# Partner influenced opportunity queries
# =========================================================


def get_partner_influence(
    db: Session,
    partner_id: int,
    opportunity_id: int,
) -> PartnerInfluencedOpportunity | None:
    return db.scalar(
        select(PartnerInfluencedOpportunity).where(
            PartnerInfluencedOpportunity.partner_id
            == partner_id,
            PartnerInfluencedOpportunity.opportunity_id
            == opportunity_id,
        )
    )


def get_influenced_opportunities_by_partner(
    db: Session,
    partner_id: int,
) -> list[PartnerInfluencedOpportunity]:
    records = db.scalars(
        select(PartnerInfluencedOpportunity)
        .where(
            PartnerInfluencedOpportunity.partner_id
            == partner_id
        )
        .order_by(
            PartnerInfluencedOpportunity.id.desc()
        )
    ).all()

    return list(records)


# =========================================================
# Partner certification queries
# =========================================================


def get_certifications_by_partner(
    db: Session,
    partner_id: int,
) -> list[PartnerCertification]:
    records = db.scalars(
        select(PartnerCertification)
        .where(
            PartnerCertification.partner_id
            == partner_id
        )
        .order_by(
            PartnerCertification.id.desc()
        )
    ).all()

    return list(records)


def get_certifications_by_employee(
    db: Session,
    employee_id: int,
) -> list[PartnerCertification]:
    records = db.scalars(
        select(PartnerCertification)
        .where(
            PartnerCertification.employee_id
            == employee_id
        )
        .order_by(
            PartnerCertification.id.desc()
        )
    ).all()

    return list(records)