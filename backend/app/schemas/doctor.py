from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMReadBase
from app.schemas.doctor_availability import DoctorAvailabilityRead


class DoctorProfileBase(BaseModel):
    specialization: str
    license_number: str = Field(max_length=25)
    medplum_practitioner_id: Optional[str] = None
    clinic_id: Optional[str] = None


class DoctorProfileCreate(DoctorProfileBase):
    user_id: str


class DoctorProfileUpdate(BaseModel):
    specialization: Optional[str] = None
    clinic_id: Optional[str] = None
    medplum_practitioner_id: Optional[str] = None


class DoctorProfileRead(DoctorProfileBase, ORMReadBase):
    user_id: str
    availability_slots: List[DoctorAvailabilityRead] = []
