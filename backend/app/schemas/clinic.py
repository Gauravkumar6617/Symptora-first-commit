from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMReadBase


class ClinicBase(BaseModel):
    name: str = Field(max_length=50)
    picture: str
    description: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None


class ClinicCreate(ClinicBase):
    medplum_organisation_id: str


class ClinicUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=50)
    picture: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None


class ClinicRead(ClinicBase, ORMReadBase):
    medplum_organisation_id: str


class DoctorClinicRead(ORMReadBase):
    doctor_profile_id: str
    clinic_id: str
    medplum_practitioner_role_id: Optional[str] = None
