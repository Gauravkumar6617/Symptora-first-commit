from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.enumModel import Status
from app.schemas.common import ORMReadBase
from app.schemas.doctor_availability import DoctorAvailabilityRead


class DoctorProfileBase(BaseModel):
    specialization: str
    license_number: str = Field(max_length=25)
    medplum_practitioner_id: Optional[str] = None
    clinic_id: Optional[str] = None


class DoctorProfileCreate(DoctorProfileBase):
    pass


class DoctorProfileUpdate(BaseModel):
    specialization: Optional[str] = None
    clinic_id: Optional[str] = None
    medplum_practitioner_id: Optional[str] = None


class DoctorProfileReject(BaseModel):
    reason: Optional[str] = None


class DoctorProfileRead(DoctorProfileBase, ORMReadBase):
    user_id: str
    status: Status
    availability_slots: List[DoctorAvailabilityRead] = []
