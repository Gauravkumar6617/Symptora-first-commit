from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.enumModel import AppointmentStatus, TimeSlot
from app.schemas.common import ORMReadBase


class AppointmentCreate(BaseModel):
    doctor_profile_id: str
    clinic_id: str
    # Book for yourself (omit) or for a family member on this account.
    family_member_id: Optional[str] = None

    patient_name: str = Field(max_length=80)
    patient_email: EmailStr
    patient_phone: str = Field(max_length=20)
    reason: str = Field(min_length=3, max_length=255)
    notes: Optional[str] = None

    appointment_date: date
    slot: TimeSlot


class AppointmentCreateByService(BaseModel):
    """Book a clinic for a service without picking a doctor — the backend
    assigns any doctor at that clinic offering the service who's free."""

    clinic_id: str
    service_id: str
    family_member_id: Optional[str] = None

    patient_name: str = Field(max_length=80)
    patient_email: EmailStr
    patient_phone: str = Field(max_length=20)
    reason: str = Field(min_length=3, max_length=255)
    notes: Optional[str] = None

    appointment_date: date
    slot: TimeSlot


class AppointmentRead(ORMReadBase):
    patient_id: str
    family_member_id: Optional[str] = None
    doctor_profile_id: str
    clinic_id: str

    patient_name: str
    patient_email: str
    patient_phone: str
    reason: str
    notes: Optional[str] = None

    appointment_date: date
    slot: TimeSlot
    status: AppointmentStatus
    meet_link: Optional[str] = None
    fee: Optional[float] = None

    # Handy for a list view without a second round trip.
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
    clinic_name: Optional[str] = None


class AppointmentCancel(BaseModel):
    reason: Optional[str] = None
