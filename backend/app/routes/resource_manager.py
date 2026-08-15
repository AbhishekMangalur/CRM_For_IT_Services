from fastapi import (
    APIRouter,
    Depends,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.resource_manager import (
    EmployeeCreate,
    EmployeePatch,
    EmployeePut,
    EmployeeResponse,
    EmployeeSkillCreate,
    EmployeeSkillPatch,
    EmployeeSkillPut,
    EmployeeSkillResponse,
    ResourceAllocationCreate,
    ResourceAllocationPatch,
    ResourceAllocationPut,
    ResourceAllocationResponse,
    ResourceRequestCreate,
    ResourceRequestPatch,
    ResourceRequestPut,
    ResourceRequestResponse,
    SkillCreate,
    SkillPatch,
    SkillPut,
    SkillResponse,
)
from app.services.resource_manager_service import (
    create_employee,
    create_employee_skill,
    create_resource_allocation,
    create_resource_request,
    create_skill,
    delete_employee,
    delete_employee_skill,
    delete_resource_allocation,
    delete_resource_request,
    delete_skill,
    get_employee,
    get_employee_skill,
    get_employee_skills,
    get_employees,
    get_resource_allocation,
    get_resource_allocations,
    get_resource_request,
    get_resource_requests,
    get_skill,
    get_skills,
    update_employee,
    update_employee_skill,
    update_resource_allocation,
    update_resource_request,
    update_skill,
)


router = APIRouter(
    prefix="/api/resource-manager",
    tags=["Resource Manager"],
    dependencies=[Depends(get_current_user)],
)


# =========================================================
# Employee routes
# =========================================================


@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee_api(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
):
    return create_employee(
        db,
        payload.model_dump(),
    )


@router.get(
    "/employees",
    response_model=list[EmployeeResponse],
)
def get_employees_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_employees(
        db,
        skip,
        limit,
    )


@router.get(
    "/employees/{employee_id}",
    response_model=EmployeeResponse,
)
def get_employee_api(
    employee_id: int,
    db: Session = Depends(get_db),
):
    return get_employee(
        db,
        employee_id,
    )


@router.put(
    "/employees/{employee_id}",
    response_model=EmployeeResponse,
)
def replace_employee_api(
    employee_id: int,
    payload: EmployeePut,
    db: Session = Depends(get_db),
):
    return update_employee(
        db,
        employee_id,
        payload.model_dump(),
    )


@router.patch(
    "/employees/{employee_id}",
    response_model=EmployeeResponse,
)
def patch_employee_api(
    employee_id: int,
    payload: EmployeePatch,
    db: Session = Depends(get_db),
):
    return update_employee(
        db,
        employee_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/employees/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_employee_api(
    employee_id: int,
    db: Session = Depends(get_db),
):
    delete_employee(
        db,
        employee_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Skill routes
# =========================================================


@router.post(
    "/skills",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_skill_api(
    payload: SkillCreate,
    db: Session = Depends(get_db),
):
    return create_skill(
        db,
        payload.model_dump(),
    )


@router.get(
    "/skills",
    response_model=list[SkillResponse],
)
def get_skills_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_skills(
        db,
        skip,
        limit,
    )


@router.get(
    "/skills/{skill_id}",
    response_model=SkillResponse,
)
def get_skill_api(
    skill_id: int,
    db: Session = Depends(get_db),
):
    return get_skill(
        db,
        skill_id,
    )


@router.put(
    "/skills/{skill_id}",
    response_model=SkillResponse,
)
def replace_skill_api(
    skill_id: int,
    payload: SkillPut,
    db: Session = Depends(get_db),
):
    return update_skill(
        db,
        skill_id,
        payload.model_dump(),
    )


@router.patch(
    "/skills/{skill_id}",
    response_model=SkillResponse,
)
def patch_skill_api(
    skill_id: int,
    payload: SkillPatch,
    db: Session = Depends(get_db),
):
    return update_skill(
        db,
        skill_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_skill_api(
    skill_id: int,
    db: Session = Depends(get_db),
):
    delete_skill(
        db,
        skill_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Employee skill routes
# =========================================================


@router.post(
    "/employee-skills",
    response_model=EmployeeSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee_skill_api(
    payload: EmployeeSkillCreate,
    db: Session = Depends(get_db),
):
    return create_employee_skill(
        db,
        payload.model_dump(),
    )


@router.get(
    "/employee-skills",
    response_model=list[EmployeeSkillResponse],
)
def get_employee_skills_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_employee_skills(
        db,
        skip,
        limit,
    )


@router.get(
    "/employee-skills/{employee_skill_id}",
    response_model=EmployeeSkillResponse,
)
def get_employee_skill_api(
    employee_skill_id: int,
    db: Session = Depends(get_db),
):
    return get_employee_skill(
        db,
        employee_skill_id,
    )


@router.put(
    "/employee-skills/{employee_skill_id}",
    response_model=EmployeeSkillResponse,
)
def replace_employee_skill_api(
    employee_skill_id: int,
    payload: EmployeeSkillPut,
    db: Session = Depends(get_db),
):
    return update_employee_skill(
        db,
        employee_skill_id,
        payload.model_dump(),
    )


@router.patch(
    "/employee-skills/{employee_skill_id}",
    response_model=EmployeeSkillResponse,
)
def patch_employee_skill_api(
    employee_skill_id: int,
    payload: EmployeeSkillPatch,
    db: Session = Depends(get_db),
):
    return update_employee_skill(
        db,
        employee_skill_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/employee-skills/{employee_skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_employee_skill_api(
    employee_skill_id: int,
    db: Session = Depends(get_db),
):
    delete_employee_skill(
        db,
        employee_skill_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Resource request routes
# =========================================================


@router.post(
    "/resource-requests",
    response_model=ResourceRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_resource_request_api(
    payload: ResourceRequestCreate,
    db: Session = Depends(get_db),
):
    return create_resource_request(
        db,
        payload.model_dump(),
    )


@router.get(
    "/resource-requests",
    response_model=list[ResourceRequestResponse],
)
def get_resource_requests_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_resource_requests(
        db,
        skip,
        limit,
    )


@router.get(
    "/resource-requests/{request_id}",
    response_model=ResourceRequestResponse,
)
def get_resource_request_api(
    request_id: int,
    db: Session = Depends(get_db),
):
    return get_resource_request(
        db,
        request_id,
    )


@router.put(
    "/resource-requests/{request_id}",
    response_model=ResourceRequestResponse,
)
def replace_resource_request_api(
    request_id: int,
    payload: ResourceRequestPut,
    db: Session = Depends(get_db),
):
    return update_resource_request(
        db,
        request_id,
        payload.model_dump(),
    )


@router.patch(
    "/resource-requests/{request_id}",
    response_model=ResourceRequestResponse,
)
def patch_resource_request_api(
    request_id: int,
    payload: ResourceRequestPatch,
    db: Session = Depends(get_db),
):
    return update_resource_request(
        db,
        request_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/resource-requests/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resource_request_api(
    request_id: int,
    db: Session = Depends(get_db),
):
    delete_resource_request(
        db,
        request_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


# =========================================================
# Resource allocation routes
# =========================================================


@router.post(
    "/resource-allocations",
    response_model=ResourceAllocationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_resource_allocation_api(
    payload: ResourceAllocationCreate,
    db: Session = Depends(get_db),
):
    return create_resource_allocation(
        db,
        payload.model_dump(),
    )


@router.get(
    "/resource-allocations",
    response_model=list[ResourceAllocationResponse],
)
def get_resource_allocations_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_resource_allocations(
        db,
        skip,
        limit,
    )


@router.get(
    "/resource-allocations/{allocation_id}",
    response_model=ResourceAllocationResponse,
)
def get_resource_allocation_api(
    allocation_id: int,
    db: Session = Depends(get_db),
):
    return get_resource_allocation(
        db,
        allocation_id,
    )


@router.put(
    "/resource-allocations/{allocation_id}",
    response_model=ResourceAllocationResponse,
)
def replace_resource_allocation_api(
    allocation_id: int,
    payload: ResourceAllocationPut,
    db: Session = Depends(get_db),
):
    return update_resource_allocation(
        db,
        allocation_id,
        payload.model_dump(),
    )


@router.patch(
    "/resource-allocations/{allocation_id}",
    response_model=ResourceAllocationResponse,
)
def patch_resource_allocation_api(
    allocation_id: int,
    payload: ResourceAllocationPatch,
    db: Session = Depends(get_db),
):
    return update_resource_allocation(
        db,
        allocation_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/resource-allocations/{allocation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resource_allocation_api(
    allocation_id: int,
    db: Session = Depends(get_db),
):
    delete_resource_allocation(
        db,
        allocation_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )