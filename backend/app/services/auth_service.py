from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User


def register_user(
    db: Session,
    full_name: str,
    email: str,
    role_id: int,
    password: str,
):
    normalized_email = email.strip().lower()
    normalized_name = full_name.strip()

    existing_user = db.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    role = db.get(
        Role,
        role_id,
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    if not role.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected role is inactive",
        )

    user = User(
        full_name=normalized_name,
        email=normalized_email,
        hashed_password=hash_password(password),
        role_id=role.id,
        is_active=True,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role_id": role.id,
                "role": role.name,
            },
        }

    except IntegrityError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from error


def forgot_password(
    db: Session,
    email: str,
    new_password: str,
):
    normalized_email = email.strip().lower()

    user = db.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email was not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive",
        )

    user.hashed_password = hash_password(
        new_password
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Password updated successfully"
    }