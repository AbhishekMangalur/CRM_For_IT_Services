from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.blended_rate import BlendedRate
from app.models.presale import Estimation
from app.schemas.blended_rate import BlendedRateCalculateRequest


TWO_PLACES = Decimal("0.01")


def _money(value: Decimal) -> Decimal:
    return value.quantize(
        TWO_PLACES,
        rounding=ROUND_HALF_UP,
    )


def _require_estimation(
    db: Session,
    estimation_id: int,
) -> Estimation:
    estimation = db.get(
        Estimation,
        estimation_id,
    )

    if not estimation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimation not found",
        )

    return estimation


def _validate_location_types(
    payload: BlendedRateCalculateRequest,
) -> None:
    location_types = [
        item.location_type.strip().upper()
        for item in payload.rates
    ]

    if len(location_types) != len(set(location_types)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate location_type entries are not allowed",
        )


def _calculate_blended_values(
    payload: BlendedRateCalculateRequest,
) -> dict:
    total_ratio = sum(
        (
            item.resource_ratio
            for item in payload.rates
        ),
        Decimal("0"),
    )

    blended_bill_rate = sum(
        (
            (
                item.resource_ratio
                / Decimal("100")
            )
            * item.bill_rate
            for item in payload.rates
        ),
        Decimal("0"),
    )

    blended_cost_rate = sum(
        (
            (
                item.resource_ratio
                / Decimal("100")
            )
            * item.cost_rate
            for item in payload.rates
        ),
        Decimal("0"),
    )

    blended_profit_per_hour = (
        blended_bill_rate
        - blended_cost_rate
    )

    if blended_bill_rate > 0:
        blended_margin_percentage = round(
            float(
                blended_profit_per_hour
                / blended_bill_rate
                * Decimal("100")
            ),
            2,
        )
    else:
        blended_margin_percentage = 0.0

    return {
        "total_ratio": _money(total_ratio),
        "blended_bill_rate": _money(
            blended_bill_rate
        ),
        "blended_cost_rate": _money(
            blended_cost_rate
        ),
        "blended_profit_per_hour": _money(
            blended_profit_per_hour
        ),
        "blended_margin_percentage": (
            blended_margin_percentage
        ),
    }


def calculate_and_save_blended_rate(
    db: Session,
    payload: BlendedRateCalculateRequest,
) -> dict:
    """
    Calculate blended bill/cost rates and persist the
    location-wise rate mix for an estimation.

    Calling this again for the same estimation replaces
    the previous blended-rate configuration.
    """

    _require_estimation(
        db,
        payload.estimation_id,
    )

    _validate_location_types(payload)

    calculated = _calculate_blended_values(
        payload
    )

    currency = (
        payload.rates[0]
        .currency
        .strip()
        .upper()
    )

    try:
        # Replace the previous resource mix for this estimation.
        db.execute(
            delete(BlendedRate).where(
                BlendedRate.estimation_id
                == payload.estimation_id
            )
        )

        records: list[BlendedRate] = []

        for item in payload.rates:
            record = BlendedRate(
                estimation_id=payload.estimation_id,
                location_type=(
                    item.location_type
                    .strip()
                    .upper()
                ),
                resource_ratio=item.resource_ratio,
                bill_rate=item.bill_rate,
                cost_rate=item.cost_rate,
                currency=item.currency.strip().upper(),
            )

            db.add(record)
            records.append(record)

        db.flush()

        for record in records:
            db.refresh(record)

        db.commit()

        return {
            "estimation_id": payload.estimation_id,
            "total_ratio": calculated["total_ratio"],
            "blended_bill_rate": (
                calculated["blended_bill_rate"]
            ),
            "blended_cost_rate": (
                calculated["blended_cost_rate"]
            ),
            "blended_profit_per_hour": (
                calculated[
                    "blended_profit_per_hour"
                ]
            ),
            "blended_margin_percentage": (
                calculated[
                    "blended_margin_percentage"
                ]
            ),
            "currency": currency,
            "rates": records,
        }

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Unable to save blended rate configuration"
            ),
        ) from error


def get_blended_rates(
    db: Session,
    estimation_id: int,
) -> dict:
    """
    Return the saved resource mix and recalculate
    the current blended metrics.
    """

    _require_estimation(
        db,
        estimation_id,
    )

    records = db.scalars(
        select(BlendedRate)
        .where(
            BlendedRate.estimation_id
            == estimation_id
        )
        .order_by(BlendedRate.id.asc())
    ).all()

    records = list(records)

    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No blended rate configuration exists "
                "for this estimation"
            ),
        )

    total_ratio = sum(
        (
            record.resource_ratio
            for record in records
        ),
        Decimal("0"),
    )

    blended_bill_rate = sum(
        (
            (
                record.resource_ratio
                / Decimal("100")
            )
            * record.bill_rate
            for record in records
        ),
        Decimal("0"),
    )

    blended_cost_rate = sum(
        (
            (
                record.resource_ratio
                / Decimal("100")
            )
            * record.cost_rate
            for record in records
        ),
        Decimal("0"),
    )

    profit_per_hour = (
        blended_bill_rate
        - blended_cost_rate
    )

    if blended_bill_rate > 0:
        margin_percentage = round(
            float(
                profit_per_hour
                / blended_bill_rate
                * Decimal("100")
            ),
            2,
        )
    else:
        margin_percentage = 0.0

    return {
        "estimation_id": estimation_id,
        "total_ratio": _money(total_ratio),
        "blended_bill_rate": _money(
            blended_bill_rate
        ),
        "blended_cost_rate": _money(
            blended_cost_rate
        ),
        "blended_profit_per_hour": _money(
            profit_per_hour
        ),
        "blended_margin_percentage": (
            margin_percentage
        ),
        "currency": records[0].currency,
        "rates": records,
    }


def delete_blended_rates(
    db: Session,
    estimation_id: int,
) -> None:
    _require_estimation(
        db,
        estimation_id,
    )

    records = db.scalars(
        select(BlendedRate).where(
            BlendedRate.estimation_id
            == estimation_id
        )
    ).all()

    records = list(records)

    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No blended rate configuration exists "
                "for this estimation"
            ),
        )

    for record in records:
        db.delete(record)

    db.commit()