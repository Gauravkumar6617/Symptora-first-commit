from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMReadBase


class UserBase(BaseModel):
    first_name: str = Field(max_length=24)
    last_name: str = Field(max_length=24)
    email: EmailStr
    number: str = Field(max_length=15)
    address: Optional[str] = Field(default=None, max_length=255)
    avatar: Optional[str] = None
    date_of_birth: datetime
    gender: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


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
    is_active: bool
    id_doctor: bool
