from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    LoginResponse,
)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.services.auth_service import (
    forgot_password,
    register_user,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


DASHBOARD_PATHS = {
    "SALES": "/sales/dashboard",
    "ACCOUNT_DIRECTOR": "/account-director/dashboard",
    "PRESALES": "/presales/dashboard",
    "RESOURCE_MANAGER": "/resource-manager/dashboard",
    "EXECUTIVE": "/executive/dashboard",
}


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    normalized_email = login_data.email.strip().lower()

    user = db.scalar(
        select(User)
        .options(joinedload(User.role))
        .where(User.email == normalized_email)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(
        login_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if not user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have an assigned role",
        )

    if not user.role.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assigned role is inactive",
        )

    role_name = user.role.name

    dashboard_path = DASHBOARD_PATHS.get(role_name)

    if not dashboard_path:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No dashboard configured for this role",
        )

    access_token = create_access_token(
        subject=str(user.id),
        additional_claims={
            "email": user.email,
            "role": role_name,
        },
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        dashboard_path=dashboard_path,
        user={
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": role_name,
        },
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def get_logged_in_user(
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.name

    dashboard_path = DASHBOARD_PATHS.get(role_name)

    if not dashboard_path:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No dashboard configured for this role",
        )

    return CurrentUserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=role_name,
        dashboard_path=dashboard_path,
    )


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=201,
)
def register_api(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    return register_user(
        db=db,
        full_name=payload.full_name,
        email=str(payload.email),
        role_id=payload.role_id,
        password=payload.password,
    )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password_api(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    return forgot_password(
        db=db,
        email=str(payload.email),
        new_password=payload.new_password,
    )