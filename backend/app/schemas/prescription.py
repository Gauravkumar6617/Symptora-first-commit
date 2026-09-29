from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import ORMReadBase


class MedicationItem(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    dosage: str = Field(min_length=1, max_length=60)
    frequency: str = Field(min_length=1, max_length=60)
    duration: str = Field(min_length=1, max_length=60)
    instructions: Optional[str] = Field(default=None, max_length=255)


class PrescriptionCreate(BaseModel):
    # Exactly one of these — which visit this prescription is for.
    appointment_id: Optional[str] = None
    consultation_id: Optional[str] = None
    medications: List[MedicationItem] = Field(min_length=1)
    notes: Optional[str] = Field(default=None, max_length=500)


class PrescriptionRead(ORMReadBase):
    appointment_id: Optional[str] = None
    consultation_id: Optional[str] = None
    doctor_profile_id: str
    patient_id: str
    family_member_id: Optional[str] = None
    medications: List[MedicationItem]
    notes: Optional[str] = None
    synced_to_medplum: bool = False

    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
    patient_name: Optional[str] = None
