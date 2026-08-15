from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.presale import (
    Estimation,
    Proposal,
    ResourceRequirement,
    Solution,
)


PresaleModel = TypeVar(
    "PresaleModel",
    Solution,
    Estimation,
    ResourceRequirement,
    Proposal,
)


def create_record(
    db: Session,
    model_class: type[PresaleModel],
    data: dict[str, Any],
) -> PresaleModel:
    record = model_class(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_record_by_id(
    db: Session,
    model_class: type[PresaleModel],
    record_id: int,
) -> PresaleModel | None:
    return db.get(model_class, record_id)


def get_all_records(
    db: Session,
    model_class: type[PresaleModel],
    skip: int = 0,
    limit: int = 100,
) -> list[PresaleModel]:
    records = db.scalars(
        select(model_class)
        .order_by(model_class.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return list(records)


def update_record(
    db: Session,
    record: PresaleModel,
    data: dict[str, Any],
) -> PresaleModel:
    for field_name, value in data.items():
        setattr(record, field_name, value)

    db.commit()
    db.refresh(record)

    return record


def delete_record(
    db: Session,
    record: PresaleModel,
) -> None:
    db.delete(record)
    db.commit()