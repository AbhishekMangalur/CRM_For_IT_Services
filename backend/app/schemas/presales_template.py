from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class PresalesTemplateCreate(BaseModel):
    template_name: str = Field(
        min_length=2,
        max_length=150,
    )

    service_type: str = Field(
        min_length=2,
        max_length=100,
    )

    description: str | None = None

    scope_content: str = Field(
        min_length=10,
    )

    is_active: bool = True


class PresalesTemplateUpdate(BaseModel):
    template_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    service_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: str | None = None

    scope_content: str | None = Field(
        default=None,
        min_length=10,
    )

    is_active: bool | None = None


class PresalesTemplateResponse(BaseModel):
    id: int

    template_name: str
    service_type: str

    description: str | None

    scope_content: str

    is_active: bool

    created_by: int | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )