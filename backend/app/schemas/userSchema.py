from datetime import datetime
from typing import Optional

from fastapi import Form
from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.common import ORMReadBase
from app.utils.integration.cloudflarR2.index import file_url


class UserBase(BaseModel):
    first_name: str = Field(max_length=24)
    last_name: str = Field(max_length=24)
    email: EmailStr
    number: str = Field(max_length=15)
    address: Optional[str] = Field(default=None, max_length=255)
    # Storage key of the avatar object in R2, not a public url.
    avatar: Optional[str] = None
    date_of_birth: datetime
    gender: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)

    @classmethod
    def as_form(
        cls,
        first_name: str = Form(...),
        last_name: str = Form(...),
        email: EmailStr = Form(...),
        number: str = Form(...),
        password: str = Form(...),
        date_of_birth: datetime = Form(...),
        address: Optional[str] = Form(None),
        gender: Optional[str] = Form(None),
    ) -> "UserCreate":
        """Parse the registration fields from multipart/form-data.

        Registration is multipart so the avatar can be uploaded with it;
        ``avatar`` is left out because it is set from the uploaded file.
        """
        return cls(
            first_name=first_name,
            last_name=last_name,
            email=email,
            number=number,
            password=password,
            date_of_birth=date_of_birth,
            address=address,
            gender=gender,
        )


class RegistrationOTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class OTPRequestResponse(BaseModel):
    detail: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=24)
    last_name: Optional[str] = Field(default=None, max_length=24)
    number: Optional[str] = Field(default=None, max_length=15)
    address: Optional[str] = Field(default=None, max_length=255)
    avatar: Optional[str] = None
    gender: Optional[str] = None


class UserResponse(UserBase, ORMReadBase):
    # Nullable in the DB — not every account has a Medplum Patient yet.
    medplum_patient_id: Optional[str] = None
    is_active: bool
    id_doctor: bool
    is_admin: bool
    # Presigned, short-lived download url derived from ``avatar``.
    avatar_url: Optional[str] = None

    @model_validator(mode="after")
    def _attach_avatar_url(self):
        if self.avatar and not self.avatar_url:
            self.avatar_url = file_url(self.avatar)
        return self

class UserLogin(BaseModel):
    email:EmailStr
    password:str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

