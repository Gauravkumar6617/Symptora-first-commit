from sqlalchemy import String, Column, ForeignKey, Enum as SAEnum, Date, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import BaseModel
from app.models.enumModel import AppointmentStatus, TimeSlot


def gen_uuid():
    return str(uuid.uuid4())


class AppointmentModel(BaseModel):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=gen_uuid)

    patient_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    # Set when booking on behalf of a family member instead of yourself.
    family_member_id = Column(UUID(as_uuid=False), ForeignKey("family_members.id"), nullable=True, index=True)
    doctor_profile_id = Column(UUID(as_uuid=False), ForeignKey("doctor_profiles.id"), nullable=False, index=True)
    clinic_id = Column(UUID(as_uuid=False), ForeignKey("clinic.id"), nullable=False, index=True)

    # Contact details captured at booking time, so a receptionist/doctor has
    # them even if they differ from the logged-in user's profile.
    patient_name = Column(String(80), nullable=False)
    patient_email = Column(String(100), nullable=False)
    patient_phone = Column(String(20), nullable=False)
    reason = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    # Snapshot of the fee at booking time — the service/doctor fee can change later.
    fee = Column(Numeric(8, 2), nullable=True)

    appointment_date = Column(Date, nullable=False)
    slot = Column(SAEnum(TimeSlot), nullable=False)

    status = Column(
        SAEnum(AppointmentStatus, name="appointment_status"),
        nullable=False,
        default=AppointmentStatus.SCHEDULED,
        server_default=AppointmentStatus.SCHEDULED.name,
    )

    # Google Meet link + calendar event id, filled in once the calendar
    # invite is created (best-effort — booking still succeeds without it).
    meet_link = Column(String, nullable=True)
    google_event_id = Column(String, nullable=True)

    patient = relationship("UserModel", foreign_keys=[patient_id])
    family_member = relationship("FamilyMemberModel", foreign_keys=[family_member_id])
    doctor_profile = relationship("DoctorProfile")
    clinic = relationship("CliniModel")
