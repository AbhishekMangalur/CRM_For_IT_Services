from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.account_director import (
    Account,
    AccountOpportunity,
    Contract,
    CustomerHealthRecord,
)
from app.models.user import User
from app.repositories.account_director_repository import (
    create_record,
    delete_record,
    get_all_records,
    get_record_by_id,
    update_record,
)


# =========================================================
# Common helpers
# =========================================================


def handle_integrity_error(
    db: Session,
    error: IntegrityError,
) -> None:
    db.rollback()

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="The operation conflicts with existing database records",
    ) from error


def require_user(
    db: Session,
    user_id: int,
    allowed_roles: set[str] | None = None,
) -> User:
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {user_id} is inactive",
        )

    if not user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID {user_id} has no assigned role",
        )

    if allowed_roles and user.role.name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": (
                    f"User with ID {user_id} does not have "
                    "the required role"
                ),
                "allowed_roles": sorted(allowed_roles),
            },
        )

    return user


# =========================================================
# Account service
# =========================================================


def require_account(
    db: Session,
    account_id: int,
) -> Account:
    account = get_record_by_id(
        db,
        Account,
        account_id,
    )

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    return account


def validate_account_relations(
    db: Session,
    data: dict[str, Any],
) -> None:
    account_director_id = data.get("account_director_id")

    if account_director_id is not None:
        require_user(
            db,
            account_director_id,
            allowed_roles={"ACCOUNT_DIRECTOR"},
        )


def validate_account_uniqueness(
    db: Session,
    data: dict[str, Any],
    existing_account: Account | None = None,
) -> None:
    account_name = data.get("account_name")

    if account_name:
        normalized_name = account_name.strip()

        existing = db.scalar(
            select(Account).where(
                Account.account_name == normalized_name
            )
        )

        if (
            existing
            and (
                existing_account is None
                or existing.id != existing_account.id
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account name already exists",
            )


def normalize_account_data(
    data: dict[str, Any],
) -> dict[str, Any]:
    if "account_name" in data:
        data["account_name"] = data["account_name"].strip()

    if (
        "primary_contact_email" in data
        and data["primary_contact_email"] is not None
    ):
        data["primary_contact_email"] = (
            data["primary_contact_email"].strip().lower()
        )

    return data


def create_account(
    db: Session,
    data: dict[str, Any],
) -> Account:
    data = normalize_account_data(data)

    validate_account_relations(db, data)
    validate_account_uniqueness(db, data)

    try:
        return create_record(
            db,
            Account,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_accounts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Account]:
    return get_all_records(
        db,
        Account,
        skip,
        limit,
    )


def get_account(
    db: Session,
    account_id: int,
) -> Account:
    return require_account(
        db,
        account_id,
    )


def update_account(
    db: Session,
    account_id: int,
    data: dict[str, Any],
) -> Account:
    account = require_account(
        db,
        account_id,
    )

    data = normalize_account_data(data)

    validate_account_relations(db, data)

    validate_account_uniqueness(
        db,
        data,
        existing_account=account,
    )

    try:
        return update_record(
            db,
            account,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_account(
    db: Session,
    account_id: int,
) -> None:
    account = require_account(
        db,
        account_id,
    )

    try:
        delete_record(
            db,
            account,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Contract service
# =========================================================


def require_contract(
    db: Session,
    contract_id: int,
) -> Contract:
    contract = get_record_by_id(
        db,
        Contract,
        contract_id,
    )

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    return contract


def validate_contract_uniqueness(
    db: Session,
    data: dict[str, Any],
    existing_contract: Contract | None = None,
) -> None:
    contract_number = data.get("contract_number")

    if contract_number:
        normalized_number = contract_number.strip().upper()

        existing = db.scalar(
            select(Contract).where(
                Contract.contract_number == normalized_number
            )
        )

        if (
            existing
            and (
                existing_contract is None
                or existing.id != existing_contract.id
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Contract number already exists",
            )


def validate_contract_relations(
    db: Session,
    data: dict[str, Any],
    existing_contract: Contract | None = None,
) -> None:
    account_id = data.get(
        "account_id",
        existing_contract.account_id
        if existing_contract
        else None,
    )

    if account_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="account_id is required",
        )

    require_account(db, account_id)

    start_date = data.get(
        "start_date",
        existing_contract.start_date
        if existing_contract
        else None,
    )

    end_date = data.get(
        "end_date",
        existing_contract.end_date
        if existing_contract
        else None,
    )

    renewal_date = data.get(
        "renewal_date",
        existing_contract.renewal_date
        if existing_contract
        else None,
    )

    if (
        start_date is not None
        and end_date is not None
        and end_date < start_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date cannot be before start_date",
        )

    if (
        start_date is not None
        and renewal_date is not None
        and renewal_date < start_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="renewal_date cannot be before start_date",
        )


def normalize_contract_data(
    data: dict[str, Any],
) -> dict[str, Any]:
    if "contract_number" in data:
        data["contract_number"] = (
            data["contract_number"].strip().upper()
        )

    return data


def create_contract(
    db: Session,
    data: dict[str, Any],
) -> Contract:
    data = normalize_contract_data(data)

    validate_contract_uniqueness(db, data)
    validate_contract_relations(db, data)

    try:
        return create_record(
            db,
            Contract,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_contracts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Contract]:
    return get_all_records(
        db,
        Contract,
        skip,
        limit,
    )


def get_contract(
    db: Session,
    contract_id: int,
) -> Contract:
    return require_contract(
        db,
        contract_id,
    )


def update_contract(
    db: Session,
    contract_id: int,
    data: dict[str, Any],
) -> Contract:
    contract = require_contract(
        db,
        contract_id,
    )

    data = normalize_contract_data(data)

    validate_contract_uniqueness(
        db,
        data,
        existing_contract=contract,
    )

    validate_contract_relations(
        db,
        data,
        existing_contract=contract,
    )

    try:
        return update_record(
            db,
            contract,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_contract(
    db: Session,
    contract_id: int,
) -> None:
    contract = require_contract(
        db,
        contract_id,
    )

    try:
        delete_record(
            db,
            contract,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Customer health record service
# =========================================================


def require_customer_health_record(
    db: Session,
    health_record_id: int,
) -> CustomerHealthRecord:
    health_record = get_record_by_id(
        db,
        CustomerHealthRecord,
        health_record_id,
    )

    if not health_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer health record not found",
        )

    return health_record


def calculate_health_values(
    data: dict[str, Any],
    existing_record: CustomerHealthRecord | None = None,
) -> dict[str, Any]:
    delivery_score = data.get(
        "delivery_score",
        existing_record.delivery_score
        if existing_record
        else 0,
    )

    financial_score = data.get(
        "financial_score",
        existing_record.financial_score
        if existing_record
        else 0,
    )

    customer_satisfaction_score = data.get(
        "customer_satisfaction_score",
        existing_record.customer_satisfaction_score
        if existing_record
        else 0,
    )

    sla_score = data.get(
        "sla_score",
        existing_record.sla_score
        if existing_record
        else 0,
    )

    overall_health_score = round(
        (
            delivery_score
            + financial_score
            + customer_satisfaction_score
            + sla_score
        )
        / 4,
        2,
    )

    if overall_health_score >= 75:
        health_status = "GREEN"
    elif overall_health_score >= 50:
        health_status = "YELLOW"
    else:
        health_status = "RED"

    data["overall_health_score"] = overall_health_score
    data["health_status"] = health_status

    return data


def validate_health_record_relations(
    db: Session,
    data: dict[str, Any],
    existing_record: CustomerHealthRecord | None = None,
) -> Account:
    account_id = data.get(
        "account_id",
        existing_record.account_id
        if existing_record
        else None,
    )

    if account_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="account_id is required",
        )

    return require_account(db, account_id)


def sync_account_health(
    account: Account,
    health_record: CustomerHealthRecord,
) -> None:
    account.customer_health_status = health_record.health_status

    if health_record.health_status == "GREEN":
        account.risk_level = "LOW"
    elif health_record.health_status == "YELLOW":
        account.risk_level = "MEDIUM"
    else:
        account.risk_level = "HIGH"


def create_customer_health_record(
    db: Session,
    data: dict[str, Any],
) -> CustomerHealthRecord:
    account = validate_health_record_relations(
        db,
        data,
    )

    calculated_data = calculate_health_values(data)

    try:
        record = CustomerHealthRecord(**calculated_data)

        db.add(record)
        db.flush()

        sync_account_health(account, record)

        db.commit()
        db.refresh(record)

        return record

    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_customer_health_records(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[CustomerHealthRecord]:
    return get_all_records(
        db,
        CustomerHealthRecord,
        skip,
        limit,
    )


def get_customer_health_record(
    db: Session,
    health_record_id: int,
) -> CustomerHealthRecord:
    return require_customer_health_record(
        db,
        health_record_id,
    )


def update_customer_health_record(
    db: Session,
    health_record_id: int,
    data: dict[str, Any],
) -> CustomerHealthRecord:
    record = require_customer_health_record(
        db,
        health_record_id,
    )

    account = validate_health_record_relations(
        db,
        data,
        existing_record=record,
    )

    calculated_data = calculate_health_values(
        data,
        existing_record=record,
    )

    try:
        for field_name, value in calculated_data.items():
            setattr(record, field_name, value)

        db.flush()

        sync_account_health(account, record)

        db.commit()
        db.refresh(record)

        return record

    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_customer_health_record(
    db: Session,
    health_record_id: int,
) -> None:
    record = require_customer_health_record(
        db,
        health_record_id,
    )

    try:
        delete_record(
            db,
            record,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Account opportunity service
# =========================================================


def require_account_opportunity(
    db: Session,
    account_opportunity_id: int,
) -> AccountOpportunity:
    account_opportunity = get_record_by_id(
        db,
        AccountOpportunity,
        account_opportunity_id,
    )

    if not account_opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account opportunity not found",
        )

    return account_opportunity


def validate_account_opportunity_relations(
    db: Session,
    data: dict[str, Any],
    existing_opportunity: AccountOpportunity | None = None,
) -> None:
    account_id = data.get(
        "account_id",
        existing_opportunity.account_id
        if existing_opportunity
        else None,
    )

    created_by = data.get(
        "created_by",
        existing_opportunity.created_by
        if existing_opportunity
        else None,
    )

    if account_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="account_id is required",
        )

    require_account(db, account_id)

    if created_by is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="created_by is required",
        )

    require_user(
        db,
        created_by,
        allowed_roles={
            "ACCOUNT_DIRECTOR",
            "SALES",
        },
    )


def create_account_opportunity(
    db: Session,
    data: dict[str, Any],
) -> AccountOpportunity:
    validate_account_opportunity_relations(
        db,
        data,
    )

    try:
        return create_record(
            db,
            AccountOpportunity,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_account_opportunities(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[AccountOpportunity]:
    return get_all_records(
        db,
        AccountOpportunity,
        skip,
        limit,
    )


def get_account_opportunity(
    db: Session,
    account_opportunity_id: int,
) -> AccountOpportunity:
    return require_account_opportunity(
        db,
        account_opportunity_id,
    )


def update_account_opportunity(
    db: Session,
    account_opportunity_id: int,
    data: dict[str, Any],
) -> AccountOpportunity:
    account_opportunity = require_account_opportunity(
        db,
        account_opportunity_id,
    )

    validate_account_opportunity_relations(
        db,
        data,
        existing_opportunity=account_opportunity,
    )

    try:
        return update_record(
            db,
            account_opportunity,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_account_opportunity(
    db: Session,
    account_opportunity_id: int,
) -> None:
    account_opportunity = require_account_opportunity(
        db,
        account_opportunity_id,
    )

    try:
        delete_record(
            db,
            account_opportunity,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)