from typing import Any, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.rfp import (
    BidEvaluation,
    RFP,
)


RFPModel = TypeVar(
    "RFPModel",
    RFP,
    BidEvaluation,
)


def create_record(
    db: Session,
    model_class: type[RFPModel],
    data: dict[str, Any],
) -> RFPModel:
    record = model_class(**data)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_record_by_id(
    db: Session,
    model_class: type[RFPModel],
    record_id: int,
) -> RFPModel | None:
    return db.get(
        model_class,
        record_id,
    )

def get_all_records(
    db: Session,
    model_class: type[RFPModel],
    skip: int = 0,
    limit: int = 100,
) -> list[RFPModel]:
    records = db.scalars(
        select(model_class)
        .order_by(model_class.id.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return list(records)


def update_record(
    db: Session,
    record: RFPModel,
    data: dict[str, Any],
) -> RFPModel:
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
    record: RFPModel,
) -> None:
    db.delete(record)
    db.commit()


# =========================================================
# RFP specific queries
# =========================================================


def get_rfp_by_number(
    db: Session,
    rfp_number: str,
) -> RFP | None:
    return db.scalar(
        select(RFP).where(
            RFP.rfp_number == rfp_number
        )
    )


def get_rfps_by_status(
    db: Session,
    rfp_status: str,
) -> list[RFP]:
    records = db.scalars(
        select(RFP)
        .where(
            RFP.rfp_status == rfp_status
        )
        .order_by(RFP.id.desc())
    ).all()

    return list(records)


def get_rfps_by_bid_decision(
    db: Session,
    bid_decision: str,
) -> list[RFP]:
    records = db.scalars(
        select(RFP)
        .where(
            RFP.bid_decision == bid_decision
        )
        .order_by(RFP.id.desc())
    ).all()

    return list(records)


# =========================================================
# Bid Evaluation queries
# =========================================================


def get_evaluations_by_rfp(
    db: Session,
    rfp_id: int,
) -> list[BidEvaluation]:
    records = db.scalars(
        select(BidEvaluation)
        .where(
            BidEvaluation.rfp_id == rfp_id
        )
        .order_by(BidEvaluation.id.desc())
    ).all()

    return list(records)


def get_latest_evaluation_for_rfp(
    db: Session,
    rfp_id: int,
) -> BidEvaluation | None:
    return db.scalar(
        select(BidEvaluation)
        .where(
            BidEvaluation.rfp_id == rfp_id
        )
        .order_by(BidEvaluation.id.desc())
        .limit(1)
    )
