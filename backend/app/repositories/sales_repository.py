from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sale import Lead, Opportunity, SalesActivity


SalesModel = TypeVar(
    "SalesModel",
    Lead,
    Opportunity,
    SalesActivity,
)


def create_record(
    db: Session,
    model_class: type[SalesModel],
    data: dict[str, Any],
) -> SalesModel:
    record = model_class(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_record_by_id(
    db: Session,
    model_class: type[SalesModel],
    record_id: int,
) -> SalesModel | None:
    return db.get(model_class, record_id)


def get_all_records(
    db: Session,
    model_class: type[SalesModel],
    skip: int = 0,
    limit: int = 100,
) -> list[SalesModel]:
    records = db.scalars(
        select(model_class)
        .order_by(model_class.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return list(records)


def update_record(
    db: Session,
    record: SalesModel,
    data: dict[str, Any],
) -> SalesModel:
    for field_name, value in data.items():
        setattr(record, field_name, value)

    db.commit()
    db.refresh(record)

    return record


def delete_record(
    db: Session,
    record: SalesModel,
) -> None:
    db.delete(record)
    db.commit()