from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resource_manager import (
    Employee,
    EmployeeSkill,
    ResourceAllocation,
    ResourceRequest,
    Skill,
)


ResourceManagerModel = TypeVar(
    "ResourceManagerModel",
    Employee,
    Skill,
    EmployeeSkill,
    ResourceRequest,
    ResourceAllocation,
)


def create_record(
    db: Session,
    model_class: type[ResourceManagerModel],
    data: dict[str, Any],
) -> ResourceManagerModel:
    record = model_class(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_record_by_id(
    db: Session,
    model_class: type[ResourceManagerModel],
    record_id: int,
) -> ResourceManagerModel | None:
    return db.get(model_class, record_id)


def get_all_records(
    db: Session,
    model_class: type[ResourceManagerModel],
    skip: int = 0,
    limit: int = 100,
) -> list[ResourceManagerModel]:
    records = db.scalars(
        select(model_class)
        .order_by(model_class.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return list(records)


def update_record(
    db: Session,
    record: ResourceManagerModel,
    data: dict[str, Any],
) -> ResourceManagerModel:
    for field_name, value in data.items():
        setattr(record, field_name, value)

    db.commit()
    db.refresh(record)

    return record


def delete_record(
    db: Session,
    record: ResourceManagerModel,
) -> None:
    db.delete(record)
    db.commit()


def get_resource_request_by_requirement_id(
    db: Session,
    resource_requirement_id: int,
) -> ResourceRequest | None:
    return db.scalar(
        select(ResourceRequest).where(
            ResourceRequest.resource_requirement_id
            == resource_requirement_id
        )
    )