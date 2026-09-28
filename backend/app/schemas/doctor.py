from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.enumModel import Status
from app.schemas.clinic import ClinicRead
from app.schemas.common import ORMReadBase
from app.schemas.doctor_availability import DoctorAvailabilityCreate, DoctorAvailabilityRead


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
    contact_person_name: Optional[str] = Field(default=None, max_length=100)
    contact_email: Optional[str] = Field(default=None, max_length=120)
    contact_phone: Optional[str] = Field(default=None, max_length=30)
    max_appointments_per_day: Optional[int] = Field(default=None, ge=1)
    fee: Optional[float] = Field(default=None, ge=0)
    availability_slots: Optional[List[DoctorAvailabilityCreate]] = None


class DoctorProfileReject(BaseModel):
    reason: Optional[str] = None


class DoctorProfileRead(DoctorProfileBase, ORMReadBase):
    user_id: str
    status: Status
    contact_person_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    max_appointments_per_day: Optional[int] = None
    fee: Optional[float] = None
    availability_slots: List[DoctorAvailabilityRead] = []


class PublicDoctorRead(BaseModel):
    """GET /doctor/{id}/public — what a patient sees on the booking page."""

    id: str
    name: str
    specialization: str
    fee: Optional[float] = None
    availability_slots: List[DoctorAvailabilityRead] = []
    clinics: List[ClinicRead] = []


class AdminDoctorRead(DoctorProfileRead):
    """DoctorProfileRead plus the fields the admin dashboard's doctor table
    needs but that live on the user/clinic rows, not the doctor profile."""

    first_name: str
    last_name: str
    email: str
    clinics: List[ClinicRead] = []
