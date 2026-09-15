from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMReadBase


class UserBase(BaseModel):
    full_name: str = Field(max_length=24)
    email: EmailStr
    number: str = Field(max_length=15)
    address: Optional[str] = Field(default=None, max_length=255)
    avatar: Optional[str] = None
    date_of_birth: datetime
    gender: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=24)
    number: Optional[str] = Field(default=None, max_length=15)
    address: Optional[str] = Field(default=None, max_length=255)
    avatar: Optional[str] = None
    gender: Optional[str] = None


class UserRead(UserBase, ORMReadBase):
    is_active: bool
    id_doctor: bool
