from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    display_name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)


class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)