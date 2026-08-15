from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role_id: int = Field(gt=0)


class UserRoleResponse(BaseModel):
    id: int
    name: str
    display_name: str

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    is_active: bool
    role: UserRoleResponse
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)