from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account_director import Contract


def get_upcoming_contract_renewals(
    db: Session,
):
    today = date.today()

    contracts = db.scalars(
        select(Contract).where(
            Contract.contract_status == "ACTIVE"
        )
    ).all()

    alerts = []

    for contract in contracts:

        target_date = (
            contract.renewal_date
            if contract.renewal_date
            else contract.end_date
        )

        days_until_renewal = (
            target_date - today
        ).days

        if days_until_renewal < 0:
            alert_level = "EXPIRED"
            renewal_status = "OVERDUE"

        elif days_until_renewal <= 30:
            alert_level = "30_DAYS"
            renewal_status = "DUE_SOON"

        elif days_until_renewal <= 60:
            alert_level = "60_DAYS"
            renewal_status = "UPCOMING"

        elif days_until_renewal <= 90:
            alert_level = "90_DAYS"
            renewal_status = "UPCOMING"

        else:
            continue

        alerts.append(
            {
                "contract_id": contract.id,
                "account_id": contract.account_id,
                "contract_number": contract.contract_number,
                "contract_value": contract.contract_value,
                "currency": contract.currency,
                "end_date": contract.end_date,
                "renewal_date": contract.renewal_date,
                "days_until_renewal": days_until_renewal,
                "alert_level": alert_level,
                "renewal_status": renewal_status,
            }
        )

    alerts.sort(
        key=lambda item: item["days_until_renewal"]
    )

    return alerts