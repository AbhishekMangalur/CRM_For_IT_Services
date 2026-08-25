import csv
import io

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account_director import (
    Account,
    CustomerHealthRecord,
)
from app.services.csv_row_hash import generate_row_hash


REQUIRED_COLUMNS = {
    "account_id",
    "delivery_score",
    "customer_satisfaction_score",
    "sla_score",
    "financial_score",
    "risk_reason",
}


# =========================================================
# Helpers
# =========================================================


def parse_score(
    value: str | None,
    field_name: str,
) -> float:
    if value is None or not value.strip():
        raise ValueError(
            f"{field_name} is required"
        )

    try:
        score = float(value)

    except ValueError as error:
        raise ValueError(
            f"{field_name} must be numeric"
        ) from error

    if score < 0 or score > 100:
        raise ValueError(
            f"{field_name} must be between 0 and 100"
        )

    return score


def calculate_health_score(
    delivery_score: float,
    customer_satisfaction_score: float,
    sla_score: float,
    financial_score: float,
) -> float:
    score = (
        delivery_score
        + customer_satisfaction_score
        + sla_score
        + financial_score
    ) / 4

    return round(
        score,
        2,
    )


def determine_health_status(
    overall_health_score: float,
) -> str:
    if overall_health_score >= 80:
        return "GREEN"

    if overall_health_score >= 60:
        return "YELLOW"

    return "RED"


def get_latest_health_record(
    db: Session,
    account_id: int,
) -> CustomerHealthRecord | None:
    return db.scalar(
        select(CustomerHealthRecord)
        .where(
            CustomerHealthRecord.account_id
            == account_id
        )
        .order_by(
            CustomerHealthRecord.recorded_at.desc()
        )
        .limit(1)
    )


# =========================================================
# Import
# =========================================================


def import_customer_health_csv(
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
    # Read CSV
    # -----------------------------------------------------

    try:
        raw_content = file.file.read()

        content = raw_content.decode(
            "utf-8-sig"
        )

    except UnicodeDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must use UTF-8 encoding",
        ) from error

    reader = csv.DictReader(
        io.StringIO(content)
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
                    sorted(missing_columns),
            },
        )

    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    rows_processed = 0
    records_updated = 0
    records_created = 0
    records_skipped = 0
    failed_rows = 0

    errors = []

    # -----------------------------------------------------
    # Process each row
    # -----------------------------------------------------

    for row_number, row in enumerate(
        reader,
        start=2,
    ):
        rows_processed += 1

        try:
            # =============================================
            # Account ID
            # =============================================

            account_id_raw = (
                row.get("account_id", "")
                .strip()
            )

            if not account_id_raw:
                raise ValueError(
                    "account_id is required"
                )

            try:
                account_id = int(
                    account_id_raw
                )

            except ValueError as error:
                raise ValueError(
                    "account_id must be an integer"
                ) from error

            # =============================================
            # Verify Account exists
            # =============================================

            account = db.get(
                Account,
                account_id,
            )

            if not account:
                raise ValueError(
                    f"Account with ID {account_id} "
                    "was not found"
                )

            # =============================================
            # Parse scores
            # =============================================

            delivery_score = parse_score(
                row.get(
                    "delivery_score"
                ),
                "delivery_score",
            )

            customer_satisfaction_score = (
                parse_score(
                    row.get(
                        "customer_satisfaction_score"
                    ),
                    "customer_satisfaction_score",
                )
            )

            sla_score = parse_score(
                row.get(
                    "sla_score"
                ),
                "sla_score",
            )

            financial_score = parse_score(
                row.get(
                    "financial_score"
                ),
                "financial_score",
            )

            # =============================================
            # Calculate CHI
            # =============================================

            overall_health_score = (
                calculate_health_score(
                    delivery_score=(
                        delivery_score
                    ),
                    customer_satisfaction_score=(
                        customer_satisfaction_score
                    ),
                    sla_score=sla_score,
                    financial_score=(
                        financial_score
                    ),
                )
            )

            health_status = (
                determine_health_status(
                    overall_health_score
                )
            )

            risk_reason = (
                row.get(
                    "risk_reason",
                    "",
                ).strip()
                or None
            )

            # =============================================
            # Find existing/latest health record
            # =============================================

            health_record = (
                get_latest_health_record(
                    db,
                    account_id,
                )
            )

            incoming_row_hash = generate_row_hash(
                {
                    "account_id": account_id,
                    "delivery_score": delivery_score,
                    "customer_satisfaction_score": customer_satisfaction_score,
                    "sla_score": sla_score,
                    "financial_score": financial_score,
                    "risk_reason": risk_reason,
                }
            )

            if health_record and health_record.row_hash == incoming_row_hash:
                records_skipped += 1
                continue

            # =============================================
            # UPDATE existing record
            # =============================================

            if health_record:
                health_record.delivery_score = (
                    delivery_score
                )

                health_record.customer_satisfaction_score = (
                    customer_satisfaction_score
                )

                health_record.sla_score = (
                    sla_score
                )

                health_record.financial_score = (
                    financial_score
                )

                health_record.overall_health_score = (
                    overall_health_score
                )

                health_record.health_status = (
                    health_status
                )

                health_record.risk_reason = (
                    risk_reason
                )

                health_record.row_hash = incoming_row_hash

                records_updated += 1

            # =============================================
            # If Account has no health record, create one
            # =============================================

            else:
                health_record = (
                    CustomerHealthRecord(
                        account_id=account_id,

                        delivery_score=(
                            delivery_score
                        ),

                        customer_satisfaction_score=(
                            customer_satisfaction_score
                        ),

                        sla_score=sla_score,

                        financial_score=(
                            financial_score
                        ),

                        overall_health_score=(
                            overall_health_score
                        ),

                        health_status=(
                            health_status
                        ),

                        risk_reason=(
                            risk_reason
                        ),

                        row_hash=incoming_row_hash,
                    )
                )

                db.add(
                    health_record
                )

                records_created += 1

            # =============================================
            # Update Account-level health status too
            # =============================================

            account.customer_health_status = (
                health_status
            )

            # Commit this row individually
            db.commit()

        except Exception as error:
            db.rollback()

            failed_rows += 1

            errors.append(
                {
                    "row":
                        row_number,

                    "account_id":
                        row.get(
                            "account_id",
                            "",
                        ),

                    "message":
                        str(error),
                }
            )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "message":
            "Customer health data imported successfully",

        "rows_processed":
            rows_processed,

        "records_updated":
            records_updated,

        "records_created":
            records_created,

        "records_skipped":
            records_skipped,

        "failed_rows":
            failed_rows,

        "errors":
            errors,
    }
