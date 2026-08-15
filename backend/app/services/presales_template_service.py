from fastapi import (
    HTTPException,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.presales_template import (
    PresalesTemplate,
)
from app.schemas.presales_template import (
    PresalesTemplateCreate,
    PresalesTemplateUpdate,
)


def create_template(
    db: Session,
    payload: PresalesTemplateCreate,
    created_by: int,
):
    existing = db.scalar(
        select(PresalesTemplate).where(
            func.lower(
                PresalesTemplate.template_name
            )
            == payload.template_name.lower()
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Template with this name "
                "already exists"
            ),
        )

    template = PresalesTemplate(
        template_name=payload.template_name.strip(),
        service_type=payload.service_type.strip(),
        description=(
            payload.description.strip()
            if payload.description
            else None
        ),
        scope_content=payload.scope_content.strip(),
        is_active=payload.is_active,
        created_by=created_by,
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return template


def get_templates(
    db: Session,
    skip: int = 0,
    limit: int = 100,
):
    return db.scalars(
        select(PresalesTemplate)
        .order_by(
            PresalesTemplate.created_at.desc()
        )
        .offset(skip)
        .limit(limit)
    ).all()


def get_template(
    db: Session,
    template_id: int,
):
    template = db.get(
        PresalesTemplate,
        template_id,
    )

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    return template


def update_template(
    db: Session,
    template_id: int,
    payload: PresalesTemplateUpdate,
):
    template = get_template(
        db,
        template_id,
    )

    data = payload.model_dump(
        exclude_unset=True
    )

    if "template_name" in data:
        duplicate = db.scalar(
            select(PresalesTemplate).where(
                func.lower(
                    PresalesTemplate.template_name
                )
                == data[
                    "template_name"
                ].lower(),

                PresalesTemplate.id
                != template_id,
            )
        )

        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Template with this name "
                    "already exists"
                ),
            )

    for field_name, value in data.items():
        if (
            isinstance(value, str)
            and value is not None
        ):
            value = value.strip()

        setattr(
            template,
            field_name,
            value,
        )

    db.commit()
    db.refresh(template)

    return template


def delete_template(
    db: Session,
    template_id: int,
):
    template = get_template(
        db,
        template_id,
    )

    db.delete(template)
    db.commit()

    return {
        "message":
            "Template deleted successfully"
    }