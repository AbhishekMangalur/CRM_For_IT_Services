import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account_director import Account, Contract
from app.models.financial import FinancialActual
from app.models.presale import Estimation
from app.models.sale import Opportunity


REQUIRED_COLUMNS = {
    "opportunity_id",
    "account_id",
    "contract_id",
    "estimation_id",
    "billing_milestone",
    "milestone_date",
    "actual_revenue",
    "actual_cost",
    "timesheet_utilization_percentage",
    "currency",
    "notes",
}


def get_financial_summary(
    db: Session,
) -> dict:
    records = list(
        db.scalars(
            select(FinancialActual).order_by(
                FinancialActual.id.desc()
            )
        ).all()
    )

    total_revenue = sum(
        (record.actual_revenue for record in records),
        Decimal("0"),
    )
    total_cost = sum(
        (record.actual_cost for record in records),
        Decimal("0"),
    )
    total_profit = sum(
        (record.actual_profit for record in records),
        Decimal("0"),
    )

    actual_margin = (
        total_profit / total_revenue * Decimal("100")
        if total_revenue > 0
        else Decimal("0")
    )

    estimation_ids = {
        record.estimation_id
        for record in records
        if record.estimation_id is not None
    }
    projected_estimations = (
        list(
            db.scalars(
                select(Estimation).where(
                    Estimation.id.in_(estimation_ids)
                )
            ).all()
        )
        if estimation_ids
        else []
    )
    projected_billing = sum(
        (
            estimation.billing_amount
            for estimation in projected_estimations
        ),
        Decimal("0"),
    )
    projected_profit = sum(
        (
            estimation.expected_profit
            for estimation in projected_estimations
        ),
        Decimal("0"),
    )
    projected_margin = (
        projected_profit
        / projected_billing
        * Decimal("100")
        if projected_billing > 0
        else None
    )

    utilization_values = [
        record.timesheet_utilization_percentage
        for record in records
        if record.timesheet_utilization_percentage is not None
    ]
    average_utilization = (
        sum(utilization_values, Decimal("0"))
        / Decimal(len(utilization_values))
        if utilization_values
        else None
    )

    return {
        "total_records": len(records),
        "actual_revenue": total_revenue,
        "actual_cost": total_cost,
        "actual_profit": total_profit,
        "actual_margin_percentage": actual_margin,
        "projected_margin_percentage": projected_margin,
        "margin_variance": (
            actual_margin - projected_margin
            if projected_margin is not None
            else None
        ),
        "timesheet_utilization_percentage": (
            round(average_utilization, 2)
            if average_utilization is not None
            else None
        ),
        "currency": records[0].currency if records else "USD",
    }


# =========================================================
# Helpers
# =========================================================


def parse_decimal(
    value: str | None,
    field_name: str,
    default: Decimal = Decimal("0"),
) -> Decimal:
    if value is None or not value.strip():
        return default

    try:
        return Decimal(
            value.strip()
        )

    except InvalidOperation as error:
        raise ValueError(
            f"{field_name} must be numeric"
        ) from error


def parse_int(
    value: str | None,
    field_name: str,
    required: bool = False,
) -> int | None:
    if value is None or not value.strip():

        if required:
            raise ValueError(
                f"{field_name} is required"
            )

        return None

    try:
        return int(
            value.strip()
        )

    except ValueError as error:
        raise ValueError(
            f"{field_name} must be an integer"
        ) from error


def parse_date(
    value: str | None,
    field_name: str,
):
    if value is None or not value.strip():
        return None

    try:
        return datetime.strptime(
            value.strip(),
            "%Y-%m-%d",
        ).date()

    except ValueError as error:
        raise ValueError(
            f"{field_name} must use YYYY-MM-DD format"
        ) from error


def calculate_actual_margin(
    actual_revenue: Decimal,
    actual_cost: Decimal,
):
    actual_profit = (
        actual_revenue
        - actual_cost
    )

    if actual_revenue > 0:
        actual_margin_percentage = (
            actual_profit
            / actual_revenue
            * Decimal("100")
        )
    else:
        actual_margin_percentage = Decimal(
            "0"
        )

    return (
        actual_profit,
        actual_margin_percentage,
    )


# =========================================================
# Existing financial actual lookup
# =========================================================


def get_existing_financial_actual(
    db: Session,
    estimation_id: int,
    opportunity_id: int,
    billing_milestone: str | None,
    milestone_date,
):
    conditions = [
        FinancialActual.estimation_id
        == estimation_id,

        FinancialActual.opportunity_id
        == opportunity_id,
    ]

    if billing_milestone is None:
        conditions.append(
            FinancialActual.billing_milestone.is_(
                None
            )
        )
    else:
        conditions.append(
            FinancialActual.billing_milestone
            == billing_milestone
        )

    if milestone_date is None:
        conditions.append(
            FinancialActual.milestone_date.is_(
                None
            )
        )
    else:
        conditions.append(
            FinancialActual.milestone_date
            == milestone_date
        )

    return db.scalar(
        select(
            FinancialActual
        ).where(
            *conditions
        )
    )


# =========================================================
# Main CSV import
# =========================================================


def import_financial_actuals_csv(
    db: Session,
    file: UploadFile,
):
    # -----------------------------------------------------
    # Validate file
    # -----------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is required",
        )

    if not file.filename.lower().endswith(
        ".csv"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported",
        )

    # -----------------------------------------------------
    # Read file
    # -----------------------------------------------------

    try:
        raw_content = file.file.read()

        content = raw_content.decode(
            "utf-8-sig"
        )

    except UnicodeDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "CSV file must use UTF-8 encoding"
            ),
        ) from error

    reader = csv.DictReader(
        io.StringIO(
            content
        )
    )

    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file has no header",
        )

    headers = {
        header.strip()
        for header in reader.fieldnames
        if header
    }

    missing_columns = (
        REQUIRED_COLUMNS
        - headers
    )

    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message":
                    "CSV is missing required columns",

                "missing_columns":
                    sorted(
                        missing_columns
                    ),
            },
        )

    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    rows_processed = 0
    records_created = 0
    records_updated = 0
    failed_rows = 0

    errors = []

    # -----------------------------------------------------
    # Process rows
    # -----------------------------------------------------

    for row_number, row in enumerate(
        reader,
        start=2,
    ):
        rows_processed += 1

        try:
            # =============================================
            # Parse IDs
            # =============================================

            opportunity_id = parse_int(
                row.get(
                    "opportunity_id"
                ),
                "opportunity_id",
                required=True,
            )

            account_id = parse_int(
                row.get(
                    "account_id"
                ),
                "account_id",
            )

            contract_id = parse_int(
                row.get(
                    "contract_id"
                ),
                "contract_id",
            )

            estimation_id = parse_int(
                row.get(
                    "estimation_id"
                ),
                "estimation_id",
                required=True,
            )

            # =============================================
            # Validate Opportunity
            # =============================================

            opportunity = db.get(
                Opportunity,
                opportunity_id,
            )

            if not opportunity:
                raise ValueError(
                    f"Opportunity with ID "
                    f"{opportunity_id} "
                    "was not found"
                )

            # =============================================
            # Validate Account
            # =============================================

            if account_id is not None:

                account = db.get(
                    Account,
                    account_id,
                )

                if not account:
                    raise ValueError(
                        f"Account with ID "
                        f"{account_id} "
                        "was not found"
                    )

            # =============================================
            # Validate Contract
            # =============================================

            if contract_id is not None:

                contract = db.get(
                    Contract,
                    contract_id,
                )

                if not contract:
                    raise ValueError(
                        f"Contract with ID "
                        f"{contract_id} "
                        "was not found"
                    )

            # =============================================
            # Validate Estimation
            # =============================================

            estimation = db.get(
                Estimation,
                estimation_id,
            )

            if not estimation:
                raise ValueError(
                    f"Estimation with ID "
                    f"{estimation_id} "
                    "was not found"
                )

            # =============================================
            # IMPORTANT:
            # Only approved estimations can have actuals
            # =============================================

            if (
                estimation.approval_status
                != "APPROVED"
            ):
                raise ValueError(
                    f"Estimation {estimation.id} "
                    "cannot be imported because "
                    "its approval status is "
                    f"{estimation.approval_status}. "
                    "Only APPROVED estimations "
                    "can have financial actuals."
                )

            # =============================================
            # Parse financial values
            # =============================================

            actual_revenue = parse_decimal(
                row.get(
                    "actual_revenue"
                ),
                "actual_revenue",
            )

            actual_cost = parse_decimal(
                row.get(
                    "actual_cost"
                ),
                "actual_cost",
            )

            if actual_revenue < 0:
                raise ValueError(
                    "actual_revenue cannot be negative"
                )

            if actual_cost < 0:
                raise ValueError(
                    "actual_cost cannot be negative"
                )

            utilization = parse_decimal(
                row.get(
                    "timesheet_utilization_percentage"
                ),
                "timesheet_utilization_percentage",
            )

            if (
                utilization < 0
                or utilization > 100
            ):
                raise ValueError(
                    "timesheet_utilization_percentage "
                    "must be between 0 and 100"
                )

            # =============================================
            # Milestone information
            # =============================================

            billing_milestone = (
                row.get(
                    "billing_milestone",
                    "",
                ).strip()
                or None
            )

            milestone_date = parse_date(
                row.get(
                    "milestone_date"
                ),
                "milestone_date",
            )

            # =============================================
            # Calculate actual financial metrics
            # =============================================

            (
                actual_profit,
                actual_margin_percentage,
            ) = calculate_actual_margin(
                actual_revenue,
                actual_cost,
            )

            actual_margin_percentage = (
                actual_margin_percentage.quantize(
                    Decimal("0.01")
                )
            )

            # =============================================
            # Projected margin from Presales
            # =============================================

            projected_margin_percentage = (
                Decimal(
                    str(
                        estimation.expected_margin_percentage
                        or 0
                    )
                )
            )

            projected_margin_percentage = (
                projected_margin_percentage.quantize(
                    Decimal("0.01")
                )
            )

            # =============================================
            # Margin variance
            # =============================================

            margin_variance = (
                actual_margin_percentage
                - projected_margin_percentage
            )

            margin_variance = (
                margin_variance.quantize(
                    Decimal("0.01")
                )
            )

            # =============================================
            # Other values
            # =============================================

            currency = (
                row.get(
                    "currency",
                    "INR",
                )
                .strip()
                .upper()
                or "INR"
            )

            notes = (
                row.get(
                    "notes",
                    "",
                ).strip()
                or None
            )

            # =============================================
            # Find existing record
            #
            # Same:
            # estimation
            # opportunity
            # milestone
            # milestone date
            #
            # => UPDATE rather than INSERT
            # =============================================

            existing_record = (
                get_existing_financial_actual(
                    db=db,
                    estimation_id=estimation_id,
                    opportunity_id=opportunity_id,
                    billing_milestone=(
                        billing_milestone
                    ),
                    milestone_date=(
                        milestone_date
                    ),
                )
            )

            # =============================================
            # UPDATE
            # =============================================

            if existing_record:

                existing_record.account_id = (
                    account_id
                )

                existing_record.contract_id = (
                    contract_id
                )

                existing_record.actual_revenue = (
                    actual_revenue
                )

                existing_record.actual_cost = (
                    actual_cost
                )

                existing_record.actual_profit = (
                    actual_profit
                )

                existing_record.actual_margin_percentage = (
                    actual_margin_percentage
                )

                existing_record.projected_margin_percentage = (
                    projected_margin_percentage
                )

                existing_record.margin_variance = (
                    margin_variance
                )

                existing_record.timesheet_utilization_percentage = (
                    utilization
                )

                existing_record.currency = (
                    currency
                )

                existing_record.source_system = (
                    "CSV_IMPORT"
                )

                existing_record.notes = (
                    notes
                )

                records_updated += 1

            # =============================================
            # CREATE
            # =============================================

            else:

                record = FinancialActual(
                    opportunity_id=(
                        opportunity_id
                    ),

                    account_id=(
                        account_id
                    ),

                    contract_id=(
                        contract_id
                    ),

                    estimation_id=(
                        estimation_id
                    ),

                    billing_milestone=(
                        billing_milestone
                    ),

                    milestone_date=(
                        milestone_date
                    ),

                    actual_revenue=(
                        actual_revenue
                    ),

                    actual_cost=(
                        actual_cost
                    ),

                    actual_profit=(
                        actual_profit
                    ),

                    actual_margin_percentage=(
                        actual_margin_percentage
                    ),

                    projected_margin_percentage=(
                        projected_margin_percentage
                    ),

                    margin_variance=(
                        margin_variance
                    ),

                    timesheet_utilization_percentage=(
                        utilization
                    ),

                    currency=(
                        currency
                    ),

                    source_system=(
                        "CSV_IMPORT"
                    ),

                    notes=(
                        notes
                    ),
                )

                db.add(
                    record
                )

                records_created += 1

            # =============================================
            # Commit one CSV row
            # =============================================

            db.commit()

        except Exception as error:
            db.rollback()

            failed_rows += 1

            errors.append(
                {
                    "row":
                        row_number,

                    "opportunity_id":
                        row.get(
                            "opportunity_id",
                            "",
                        ),

                    "estimation_id":
                        row.get(
                            "estimation_id",
                            "",
                        ),

                    "message":
                        str(error),
                }
            )

    # =====================================================
    # Response
    # =====================================================

    return {
        "message":
            "Financial actuals imported successfully",

        "rows_processed":
            rows_processed,

        "records_created":
            records_created,

        "records_updated":
            records_updated,

        "failed_rows":
            failed_rows,

        "errors":
            errors,
    }
