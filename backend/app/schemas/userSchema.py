from datetime import datetime
from typing import Optional

from fastapi import Form
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, EmailStr, Field, ValidationError, model_validator

from app.models.enumModel import Status
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

    @classmethod
    def as_form(
        cls,
        first_name: Optional[str] = Form(None),
        last_name: Optional[str] = Form(None),
        number: Optional[str] = Form(None),
        address: Optional[str] = Form(None),
        gender: Optional[str] = Form(None),
    ) -> "UserUpdate":
        """Parse a profile edit from multipart/form-data.

        Only the fields actually sent are set, so ``exclude_unset`` leaves the
        rest alone. An empty ``address``/``gender`` clears it. ``avatar`` is
        set from the uploaded file, never from a client-supplied key.
        """
        values = {
            "first_name": first_name,
            "last_name": last_name,
            "number": number,
            "address": address,
            "gender": gender,
        }
        sent = {key: value for key, value in values.items() if value is not None}
        for clearable in ("address", "gender"):
            if sent.get(clearable) == "":
                sent[clearable] = None
        try:
            return cls(**sent)
        except ValidationError as e:
            # Report bad fields as a 422 instead of an unhandled 500.
            raise RequestValidationError(e.errors())


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

class CurrentUserResponse(UserResponse):
    """GET/PATCH /users/me — the account plus its doctor application, so
    every client derives the same role from one response."""

    # None when the user never applied to become a doctor.
    doctor_status: Optional[Status] = None
    specialization: Optional[str] = None


class UserLogin(BaseModel):
    email:EmailStr
    password:str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

