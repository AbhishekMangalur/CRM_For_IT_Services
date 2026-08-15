from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleResponse


router = APIRouter(
    prefix="/api/roles",
    tags=["Roles"],
)


ALLOWED_ROLES = {
    "SALES",
    "ACCOUNT_DIRECTOR",
    "PRESALES",
    "RESOURCE_MANAGER",
    "EXECUTIVE",
}


@router.post(
    "",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
):
    normalized_name = role_data.name.strip().upper()

    if normalized_name not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid role name",
                "allowed_roles": sorted(ALLOWED_ROLES),
            },
        )

    existing_role = db.scalar(
        select(Role).where(Role.name == normalized_name)
    )

    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role already exists",
        )

    role = Role(
        name=normalized_name,
        display_name=role_data.display_name.strip(),
        description=(
            role_data.description.strip()
            if role_data.description
            else None
        ),
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return role


@router.get(
    "",
    response_model=list[RoleResponse],
)
def get_roles(
    db: Session = Depends(get_db),
):
    roles = db.scalars(
        select(Role).order_by(Role.id)
    ).all()

    return list(roles)


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
    dependencies=[Depends(get_current_user)],
)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
):
    role = db.get(Role, role_id)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    return role
