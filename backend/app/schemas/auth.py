from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


class UserRegistration(BaseModel):
    full_name: str = Field(min_length=2, max_length=20)

    phone_number: str = Field(
        min_length=7,
        max_length=12,
        pattern=r"^\+?[0-9]{7,11}$",
    )

    email: EmailStr = Field(max_length=30)
    password: str = Field(min_length=8, max_length=80)
    confirm_password: str

    @field_validator("phone_number", mode="before")
    @classmethod
    def normalize_phone_number(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def validate_password_confirmation(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserLogin(BaseModel):
    identifier: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=80)
