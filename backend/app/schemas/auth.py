from pydantic import BaseModel, EmailStr, Field, model_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class LoginUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    dashboard_path: str
    user: LoginUserResponse


class CurrentUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    dashboard_path: str


# =========================================================
# Registration
# =========================================================


class RegisterRequest(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    role_id: int = Field(gt=0)

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=128,
    )

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.password != self.confirm_password:
            raise ValueError(
                "Password and confirm password do not match"
            )

        return self


class RegisteredUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role_id: int
    role: str


class RegisterResponse(BaseModel):
    message: str
    user: RegisteredUserResponse


# =========================================================
# Forgot Password
# =========================================================


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=128,
    )

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.new_password != self.confirm_password:
            raise ValueError(
                "New password and confirm password do not match"
            )

        return self


class ForgotPasswordResponse(BaseModel):
    message: str
