from sqlalchemy import JSON, String, Text, Column, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import BaseModel


def gen_uuid():
    return str(uuid.uuid4())


class PrescriptionModel(BaseModel):
    """An e-prescription a doctor issues after an appointment or instant
    consultation — exactly one of appointment_id/consultation_id is set."""

    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)

    appointment_id = Column(UUID(as_uuid=False), ForeignKey("appointments.id"), nullable=True, index=True)
    consultation_id = Column(
        UUID(as_uuid=False), ForeignKey("telemedicine_consultations.id"), nullable=True, index=True
    )
    doctor_profile_id = Column(UUID(as_uuid=False), ForeignKey("doctor_profiles.id"), nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=False), ForeignKey("family_members.id"), nullable=True, index=True)

    # [{name, dosage, frequency, duration, instructions}]
    medications = Column(JSON, nullable=False)
    notes = Column(Text, nullable=True)

    # FHIR MedicationRequest created in Medplum — best effort, like the rest
    # of the Medplum sync in this app.
    medplum_medication_request_id = Column(String, nullable=True)

    doctor_profile = relationship("DoctorProfile")
    consultation = relationship("TelemedicineConsultationModel")
    patient = relationship("UserModel", foreign_keys=[patient_id])
    family_member = relationship("FamilyMemberModel", foreign_keys=[family_member_id])
