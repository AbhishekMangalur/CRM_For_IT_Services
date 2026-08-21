# communication with the database for account director related models
from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account_director import (
    Account,
    AccountOpportunity,
    Contract,
    CustomerHealthRecord,
)


AccountDirectorModel = TypeVar(
    "AccountDirectorModel",
    Account,
    Contract,
    CustomerHealthRecord,
    AccountOpportunity,
)


def create_record(
    db: Session,
    model_class: type[AccountDirectorModel],
    data: dict[str, Any],
) -> AccountDirectorModel:
    record = model_class(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_record_by_id(
    db: Session,
    model_class: type[AccountDirectorModel],
    record_id: int,
) -> AccountDirectorModel | None:
    return db.get(model_class, record_id)


def get_all_records(
    db: Session,
    model_class: type[AccountDirectorModel],
    skip: int = 0,
    limit: int = 100,
) -> list[AccountDirectorModel]:
    records = db.scalars(
        select(model_class)
        .order_by(model_class.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return list(records)


def update_record(
    db: Session,
    record: AccountDirectorModel,
    data: dict[str, Any],
) -> AccountDirectorModel:
    for field_name, value in data.items():
        setattr(record, field_name, value)

    db.commit()
    db.refresh(record)

    return record


def delete_record(
    db: Session,
    record: AccountDirectorModel,
) -> None:
    db.delete(record)
    db.commit()