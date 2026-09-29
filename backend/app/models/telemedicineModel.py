from sqlalchemy import String, Column, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import BaseModel
from app.models.enumModel import ConsultationStatus, ConsultationTrigger


def gen_uuid():
    return str(uuid.uuid4())


class TelemedicineConsultationModel(BaseModel):
    """An instant, patient-started video consultation — no clinic/doctor
    picked in advance; whichever approved doctor accepts first gets it."""

    __tablename__ = "telemedicine_consultations"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)

    patient_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=False), ForeignKey("family_members.id"), nullable=True, index=True)
    # Null until an approved doctor accepts.
    doctor_profile_id = Column(UUID(as_uuid=False), ForeignKey("doctor_profiles.id"), nullable=True, index=True)

    reason = Column(String(255), nullable=False)
    # Set when this was auto-created from a High risk symptom check.
    symptom_check_id = Column(UUID(as_uuid=False), ForeignKey("symptom_checks.id"), nullable=True, index=True)

    status = Column(
        SAEnum(ConsultationStatus, name="consultation_status"),
        nullable=False,
        default=ConsultationStatus.PENDING,
        server_default=ConsultationStatus.PENDING.name,
    )
    trigger = Column(
        SAEnum(ConsultationTrigger, name="consultation_trigger"),
        nullable=False,
        default=ConsultationTrigger.MANUAL_BOOKING,
        server_default=ConsultationTrigger.MANUAL_BOOKING.name,
    )

    # FHIR Encounter created once a doctor accepts — best effort, like the
    # rest of the Medplum sync in this app.
    medplum_encounter_id = Column(String, nullable=True)

    patient = relationship("UserModel", foreign_keys=[patient_id])
    family_member = relationship("FamilyMemberModel", foreign_keys=[family_member_id])
    doctor_profile = relationship("DoctorProfile")
