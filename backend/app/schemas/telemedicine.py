from typing import Optional

from pydantic import BaseModel, Field

from app.models.enumModel import ConsultationStatus, ConsultationTrigger
from app.schemas.common import ORMReadBase


class TelemedicineStart(BaseModel):
    """Patient starts an instant consultation — just who it's for and why;
    everything else (name/email/phone) is read off their own account."""

    family_member_id: Optional[str] = None
    reason: str = Field(min_length=3, max_length=255)


class TelemedicineRead(ORMReadBase):
    patient_id: str
    family_member_id: Optional[str] = None
    doctor_profile_id: Optional[str] = None
    reason: str
    status: ConsultationStatus
    trigger: ConsultationTrigger

    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
