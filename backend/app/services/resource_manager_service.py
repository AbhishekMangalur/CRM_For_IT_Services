from datetime import date, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.presale import ResourceRequirement, Solution
from app.models.resource_manager import (
    Employee,
    EmployeeSkill,
    ResourceAllocation,
    ResourceRequest,
    Skill,
)
from app.models.sale import Opportunity
from app.models.user import User
from app.repositories.resource_manager_repository import (
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


def require_opportunity(
    db: Session,
    opportunity_id: int,
) -> Opportunity:
    opportunity = db.get(Opportunity, opportunity_id)

    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found",
        )

    return opportunity


def require_solution(
    db: Session,
    solution_id: int,
) -> Solution:
    solution = db.get(Solution, solution_id)

    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solution not found",
        )

    return solution


# =========================================================
# Employee service
# =========================================================


def require_employee(
    db: Session,
    employee_id: int,
) -> Employee:
    employee = get_record_by_id(
        db,
        Employee,
        employee_id,
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    return employee


def validate_employee_uniqueness(
    db: Session,
    data: dict[str, Any],
    existing_employee: Employee | None = None,
) -> None:
    employee_code = data.get("employee_code")

    if employee_code:
        employee_with_code = db.scalar(
            select(Employee).where(
                Employee.employee_code == employee_code.strip().upper()
            )
        )

        if (
            employee_with_code
            and (
                existing_employee is None
                or employee_with_code.id != existing_employee.id
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee code already exists",
            )

    email = data.get("email")

    if email:
        employee_with_email = db.scalar(
            select(Employee).where(
                Employee.email == email.strip().lower()
            )
        )

        if (
            employee_with_email
            and (
                existing_employee is None
                or employee_with_email.id != existing_employee.id
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee email already exists",
            )


def normalize_employee_data(
    data: dict[str, Any],
) -> dict[str, Any]:
    if "employee_code" in data:
        data["employee_code"] = (
            data["employee_code"].strip().upper()
        )

    if "email" in data:
        data["email"] = data["email"].strip().lower()

    if "full_name" in data:
        data["full_name"] = data["full_name"].strip()

    if "designation" in data:
        data["designation"] = data["designation"].strip()

    return data


def create_employee(
    db: Session,
    data: dict[str, Any],
) -> Employee:
    data = normalize_employee_data(data)

    validate_employee_uniqueness(
        db,
        data,
    )

    try:
        return create_record(
            db,
            Employee,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_employees(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Employee]:
    complete_expired_resource_allocations(db)

    return get_all_records(
        db,
        Employee,
        skip,
        limit,
    )


def get_employee(
    db: Session,
    employee_id: int,
) -> Employee:
    complete_expired_resource_allocations(db)

    return require_employee(
        db,
        employee_id,
    )


def update_employee(
    db: Session,
    employee_id: int,
    data: dict[str, Any],
) -> Employee:
    employee = require_employee(
        db,
        employee_id,
    )

    data = normalize_employee_data(data)

    validate_employee_uniqueness(
        db,
        data,
        existing_employee=employee,
    )

    try:
        return update_record(
            db,
            employee,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_employee(
    db: Session,
    employee_id: int,
) -> None:
    employee = require_employee(
        db,
        employee_id,
    )

    try:
        delete_record(
            db,
            employee,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Skill service
# =========================================================


def require_skill(
    db: Session,
    skill_id: int,
) -> Skill:
    skill = get_record_by_id(
        db,
        Skill,
        skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    return skill


def validate_skill_uniqueness(
    db: Session,
    name: str,
    existing_skill: Skill | None = None,
) -> None:
    existing = db.scalar(
        select(Skill).where(
            Skill.name == name.strip()
        )
    )

    if (
        existing
        and (
            existing_skill is None
            or existing.id != existing_skill.id
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill already exists",
        )


def create_skill(
    db: Session,
    data: dict[str, Any],
) -> Skill:
    data["name"] = data["name"].strip()

    validate_skill_uniqueness(
        db,
        data["name"],
    )

    try:
        return create_record(
            db,
            Skill,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_skills(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Skill]:
    return get_all_records(
        db,
        Skill,
        skip,
        limit,
    )


def get_skill(
    db: Session,
    skill_id: int,
) -> Skill:
    return require_skill(
        db,
        skill_id,
    )


def update_skill(
    db: Session,
    skill_id: int,
    data: dict[str, Any],
) -> Skill:
    skill = require_skill(
        db,
        skill_id,
    )

    if "name" in data:
        data["name"] = data["name"].strip()

        validate_skill_uniqueness(
            db,
            data["name"],
            existing_skill=skill,
        )

    try:
        return update_record(
            db,
            skill,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_skill(
    db: Session,
    skill_id: int,
) -> None:
    skill = require_skill(
        db,
        skill_id,
    )

    try:
        delete_record(
            db,
            skill,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Employee skill service
# =========================================================


def require_employee_skill(
    db: Session,
    employee_skill_id: int,
) -> EmployeeSkill:
    employee_skill = get_record_by_id(
        db,
        EmployeeSkill,
        employee_skill_id,
    )

    if not employee_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee skill not found",
        )

    return employee_skill


def validate_employee_skill_relations(
    db: Session,
    data: dict[str, Any],
    existing_employee_skill: EmployeeSkill | None = None,
) -> None:
    employee_id = data.get(
        "employee_id",
        existing_employee_skill.employee_id
        if existing_employee_skill
        else None,
    )

    skill_id = data.get(
        "skill_id",
        existing_employee_skill.skill_id
        if existing_employee_skill
        else None,
    )

    if employee_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="employee_id is required",
        )

    if skill_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="skill_id is required",
        )

    employee = require_employee(
        db,
        employee_id,
    )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign a skill to an inactive employee",
        )

    skill = require_skill(
        db,
        skill_id,
    )

    if not skill.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign an inactive skill",
        )

    duplicate = db.scalar(
        select(EmployeeSkill).where(
            EmployeeSkill.employee_id == employee_id,
            EmployeeSkill.skill_id == skill_id,
        )
    )

    if (
        duplicate
        and (
            existing_employee_skill is None
            or duplicate.id != existing_employee_skill.id
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This skill is already assigned to the employee",
        )


def create_employee_skill(
    db: Session,
    data: dict[str, Any],
) -> EmployeeSkill:
    validate_employee_skill_relations(
        db,
        data,
    )

    try:
        return create_record(
            db,
            EmployeeSkill,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_employee_skills(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[EmployeeSkill]:
    return get_all_records(
        db,
        EmployeeSkill,
        skip,
        limit,
    )


def get_employee_skill(
    db: Session,
    employee_skill_id: int,
) -> EmployeeSkill:
    return require_employee_skill(
        db,
        employee_skill_id,
    )


def update_employee_skill(
    db: Session,
    employee_skill_id: int,
    data: dict[str, Any],
) -> EmployeeSkill:
    employee_skill = require_employee_skill(
        db,
        employee_skill_id,
    )

    validate_employee_skill_relations(
        db,
        data,
        existing_employee_skill=employee_skill,
    )

    try:
        return update_record(
            db,
            employee_skill,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_employee_skill(
    db: Session,
    employee_skill_id: int,
) -> None:
    employee_skill = require_employee_skill(
        db,
        employee_skill_id,
    )

    try:
        delete_record(
            db,
            employee_skill,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Resource request service
# =========================================================


def require_resource_request(
    db: Session,
    request_id: int,
) -> ResourceRequest:
    resource_request = get_record_by_id(
        db,
        ResourceRequest,
        request_id,
    )

    if not resource_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found",
        )

    return resource_request


def validate_resource_request_relations(
    db: Session,
    data: dict[str, Any],
    existing_request: ResourceRequest | None = None,
) -> None:
    opportunity_id = data.get(
        "opportunity_id",
        existing_request.opportunity_id
        if existing_request
        else None,
    )

    solution_id = data.get(
        "solution_id",
        existing_request.solution_id
        if existing_request
        else None,
    )

    requested_by = data.get(
        "requested_by",
        existing_request.requested_by
        if existing_request
        else None,
    )

    if opportunity_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="opportunity_id is required",
        )

    opportunity = require_opportunity(
        db,
        opportunity_id,
    )

    if solution_id is not None:
        solution = require_solution(
            db,
            solution_id,
        )

        if solution.opportunity_id != opportunity.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "The selected solution does not belong "
                    "to the selected opportunity"
                ),
            )

    if requested_by is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="requested_by is required",
        )

    require_user(
        db,
        requested_by,
        allowed_roles={
            "SALES",
            "PRESALES",
            "RESOURCE_MANAGER",
            "ACCOUNT_DIRECTOR",
        },
    )

    required_from = data.get(
        "required_from",
        existing_request.required_from
        if existing_request
        else None,
    )

    required_until = data.get(
        "required_until",
        existing_request.required_until
        if existing_request
        else None,
    )

    if (
        required_from is not None
        and required_until is not None
        and required_until < required_from
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="required_until cannot be before required_from",
        )


def create_resource_request(
    db: Session,
    data: dict[str, Any],
) -> ResourceRequest:
    validate_resource_request_relations(
        db,
        data,
    )

    try:
        return create_record(
            db,
            ResourceRequest,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_resource_requests(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[ResourceRequest]:
    return get_all_records(
        db,
        ResourceRequest,
        skip,
        limit,
    )


def get_resource_request(
    db: Session,
    request_id: int,
) -> ResourceRequest:
    return require_resource_request(
        db,
        request_id,
    )


def update_resource_request(
    db: Session,
    request_id: int,
    data: dict[str, Any],
) -> ResourceRequest:
    resource_request = require_resource_request(
        db,
        request_id,
    )

    validate_resource_request_relations(
        db,
        data,
        existing_request=resource_request,
    )

    try:
        return update_record(
            db,
            resource_request,
            data,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_resource_request(
    db: Session,
    request_id: int,
) -> None:
    resource_request = require_resource_request(
        db,
        request_id,
    )

    try:
        delete_record(
            db,
            resource_request,
        )
    except IntegrityError as error:
        handle_integrity_error(db, error)


# =========================================================
# Resource allocation service
# =========================================================


def require_resource_allocation(
    db: Session,
    allocation_id: int,
) -> ResourceAllocation:
    allocation = get_record_by_id(
        db,
        ResourceAllocation,
        allocation_id,
    )

    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource allocation not found",
        )

    return allocation


def validate_resource_allocation_relations(
    db: Session,
    data: dict[str, Any],
    existing_allocation: ResourceAllocation | None = None,
) -> None:
    employee_id = data.get(
        "employee_id",
        existing_allocation.employee_id
        if existing_allocation
        else None,
    )

    opportunity_id = data.get(
        "opportunity_id",
        existing_allocation.opportunity_id
        if existing_allocation
        else None,
    )

    solution_id = data.get(
        "solution_id",
        existing_allocation.solution_id
        if existing_allocation
        else None,
    )

    resource_request_id = data.get(
        "resource_request_id",
        existing_allocation.resource_request_id
        if existing_allocation
        else None,
    )

    allocated_by = data.get(
        "allocated_by",
        existing_allocation.allocated_by
        if existing_allocation
        else None,
    )

    if employee_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="employee_id is required",
        )

    employee = require_employee(
        db,
        employee_id,
    )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot allocate an inactive employee",
        )

    if (
        opportunity_id is None
        and solution_id is None
        and resource_request_id is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "At least one of opportunity_id, solution_id, "
                "or resource_request_id must be provided"
            ),
        )

    opportunity = None
    solution = None
    resource_request = None

    if opportunity_id is not None:
        opportunity = require_opportunity(
            db,
            opportunity_id,
        )

    if solution_id is not None:
        solution = require_solution(
            db,
            solution_id,
        )

    if resource_request_id is not None:
        resource_request = require_resource_request(
            db,
            resource_request_id,
        )

    if (
        opportunity
        and solution
        and solution.opportunity_id != opportunity.id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The selected solution does not belong "
                "to the selected opportunity"
            ),
        )

    if resource_request:
        if (
            opportunity
            and resource_request.opportunity_id
            != opportunity.id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "The resource request does not belong "
                    "to the selected opportunity"
                ),
            )

        if (
            solution
            and resource_request.solution_id is not None
            and resource_request.solution_id != solution.id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "The resource request does not belong "
                    "to the selected solution"
                ),
            )

    if allocated_by is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="allocated_by is required",
        )

    require_user(
        db,
        allocated_by,
        allowed_roles={"RESOURCE_MANAGER"},
    )

    start_date = data.get(
        "start_date",
        existing_allocation.start_date
        if existing_allocation
        else None,
    )

    end_date = data.get(
        "end_date",
        existing_allocation.end_date
        if existing_allocation
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
        and employee.available_from is not None
        and start_date < employee.available_from
        and (
            existing_allocation is None
            or existing_allocation.employee_id != employee.id
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Employee {employee.employee_code} is available from "
                f"{employee.available_from.isoformat()}; allocation cannot "
                f"start on {start_date.isoformat()}"
            ),
        )

    allocation_percentage = data.get(
        "allocation_percentage",
        existing_allocation.allocation_percentage
        if existing_allocation
        else 100,
    )

    if not 0 < allocation_percentage <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Allocation percentage must be greater than 0 "
                "and less than or equal to 100"
            ),
        )

    available_utilization = employee.current_utilization_percentage

    if (
        existing_allocation is not None
        and existing_allocation.employee_id == employee.id
    ):
        available_utilization -= existing_allocation.allocation_percentage

    if available_utilization + allocation_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "The allocation would make employee utilization "
                "greater than 100%"
            ),
        )


def update_employee_utilization(
    employee: Employee,
    percentage_change: float,
) -> None:
    new_percentage = (
        employee.current_utilization_percentage
        + percentage_change
    )

    employee.current_utilization_percentage = max(
        0,
        min(100, new_percentage),
    )

    if employee.current_utilization_percentage >= 100:
        employee.availability_status = "ALLOCATED"
    elif employee.current_utilization_percentage > 0:
        employee.availability_status = "PARTIALLY_AVAILABLE"
    else:
        employee.availability_status = "AVAILABLE"


def synchronize_employee_availability(
    db: Session,
    employee_id: int,
    as_of: date | None = None,
) -> Employee:
    """Recalculate availability from active allocations."""
    effective_date = as_of or date.today()
    employee = require_employee(db, employee_id)
    active_allocations = list(
        db.scalars(
            select(ResourceAllocation).where(
                ResourceAllocation.employee_id == employee_id,
                ResourceAllocation.allocation_status.in_(
                    {"PENDING", "CONFIRMED"},
                ),
            )
        ).all()
    )
    employee.current_utilization_percentage = min(
        100,
        sum(
            allocation.allocation_percentage
            for allocation in active_allocations
        ),
    )

    if employee.current_utilization_percentage >= 100:
        employee.availability_status = "ALLOCATED"
        ending_dates = [
            allocation.end_date
            for allocation in active_allocations
            if allocation.end_date is not None
        ]
        # Allocation end dates are inclusive. Capacity is available the day
        # after the first active allocation finishes.
        employee.available_from = (
            min(ending_dates) + timedelta(days=1)
            if ending_dates
            else None
        )
    elif employee.current_utilization_percentage > 0:
        employee.availability_status = "PARTIALLY_AVAILABLE"
        employee.available_from = effective_date
    else:
        employee.availability_status = "AVAILABLE"
        employee.available_from = effective_date

    return employee


def synchronize_linked_requirement_allocation_status(
    db: Session,
    resource_request_id: int | None,
) -> None:
    if resource_request_id is None:
        return

    resource_request = db.get(ResourceRequest, resource_request_id)

    if (
        resource_request is None
        or resource_request.resource_requirement_id is None
    ):
        return

    active_allocation_count = db.scalar(
        select(func.count(ResourceAllocation.id)).where(
            ResourceAllocation.resource_request_id
            == resource_request.id,
            ResourceAllocation.allocation_status.in_(
                {"PENDING", "CONFIRMED"},
            ),
        )
    ) or 0

    is_allocated = active_allocation_count > 0
    resource_request.request_status = (
        "ALLOCATED" if is_allocated else "PENDING"
    )

    requirement = db.get(
        ResourceRequirement,
        resource_request.resource_requirement_id,
    )

    if requirement is not None:
        requirement.availability_status = (
            "ALLOCATED" if is_allocated else "PENDING"
        )


def complete_expired_resource_allocations(
    db: Session,
    as_of: date | None = None,
) -> int:
    effective_date = as_of or date.today()
    expired_allocations = list(
        db.scalars(
            select(ResourceAllocation)
            .where(
                ResourceAllocation.allocation_status.in_(
                    {"PENDING", "CONFIRMED"},
                ),
                ResourceAllocation.end_date.is_not(None),
                ResourceAllocation.end_date < effective_date,
            )
            .with_for_update()
        ).all()
    )

    if not expired_allocations:
        return 0

    employee_ids = {
        allocation.employee_id
        for allocation in expired_allocations
    }
    resource_request_ids = {
        allocation.resource_request_id
        for allocation in expired_allocations
        if allocation.resource_request_id is not None
    }

    for allocation in expired_allocations:
        allocation.allocation_status = "COMPLETED"

    db.flush()

    for employee_id in employee_ids:
        synchronize_employee_availability(
            db,
            employee_id,
            as_of=effective_date,
        )

    for resource_request_id in resource_request_ids:
        synchronize_linked_requirement_allocation_status(
            db,
            resource_request_id,
        )

    db.commit()
    return len(expired_allocations)


def create_resource_allocation(
    db: Session,
    data: dict[str, Any],
) -> ResourceAllocation:
    validate_resource_allocation_relations(
        db,
        data,
    )

    employee = require_employee(
        db,
        data["employee_id"],
    )

    try:
        allocation = ResourceAllocation(**data)

        db.add(allocation)

        update_employee_utilization(
            employee,
            data["allocation_percentage"],
        )

        db.flush()
        synchronize_employee_availability(
            db,
            employee.id,
        )
        synchronize_linked_requirement_allocation_status(
            db,
            data.get("resource_request_id"),
        )

        db.commit()
        db.refresh(allocation)

        return allocation

    except IntegrityError as error:
        handle_integrity_error(db, error)


def get_resource_allocations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[ResourceAllocation]:
    complete_expired_resource_allocations(db)

    return get_all_records(
        db,
        ResourceAllocation,
        skip,
        limit,
    )


def get_resource_allocation(
    db: Session,
    allocation_id: int,
) -> ResourceAllocation:
    complete_expired_resource_allocations(db)

    return require_resource_allocation(
        db,
        allocation_id,
    )


def update_resource_allocation(
    db: Session,
    allocation_id: int,
    data: dict[str, Any],
) -> ResourceAllocation:
    allocation = require_resource_allocation(
        db,
        allocation_id,
    )

    validate_resource_allocation_relations(
        db,
        data,
        existing_allocation=allocation,
    )

    old_employee = require_employee(
        db,
        allocation.employee_id,
    )

    old_percentage = allocation.allocation_percentage
    old_resource_request_id = allocation.resource_request_id

    new_employee_id = data.get(
        "employee_id",
        allocation.employee_id,
    )

    new_percentage = data.get(
        "allocation_percentage",
        allocation.allocation_percentage,
    )

    new_employee = require_employee(
        db,
        new_employee_id,
    )

    try:
        if old_employee.id == new_employee.id:
            percentage_difference = (
                new_percentage - old_percentage
            )

            update_employee_utilization(
                old_employee,
                percentage_difference,
            )
        else:
            update_employee_utilization(
                old_employee,
                -old_percentage,
            )

            update_employee_utilization(
                new_employee,
                new_percentage,
            )

        for field_name, value in data.items():
            setattr(allocation, field_name, value)

        db.flush()
        synchronize_employee_availability(
            db,
            old_employee.id,
        )
        if new_employee.id != old_employee.id:
            synchronize_employee_availability(
                db,
                new_employee.id,
            )
        synchronize_linked_requirement_allocation_status(
            db,
            old_resource_request_id,
        )
        synchronize_linked_requirement_allocation_status(
            db,
            allocation.resource_request_id,
        )

        db.commit()
        db.refresh(allocation)

        return allocation

    except IntegrityError as error:
        handle_integrity_error(db, error)


def delete_resource_allocation(
    db: Session,
    allocation_id: int,
) -> None:
    allocation = require_resource_allocation(
        db,
        allocation_id,
    )

    employee = require_employee(
        db,
        allocation.employee_id,
    )
    resource_request_id = allocation.resource_request_id

    try:
        update_employee_utilization(
            employee,
            -allocation.allocation_percentage,
        )

        db.delete(allocation)
        db.flush()
        synchronize_employee_availability(
            db,
            employee.id,
        )
        synchronize_linked_requirement_allocation_status(
            db,
            resource_request_id,
        )
        db.commit()

    except IntegrityError as error:
        handle_integrity_error(db, error)
