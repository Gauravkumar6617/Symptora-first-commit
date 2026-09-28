from sqlalchemy import String,Column,Integer,Boolean,ForeignKey,Enum as SAEnum,Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
from app.models.enumModel import Status
import uuid

def gen_uuid():
    #Generates a fresh random unique ID string for a new row's primary key
    return str(uuid.uuid4())

class DoctorProfile(BaseModel):
    __tablename__ = "doctor_profiles"

    id=Column(UUID(as_uuid=False),primary_key=True,index=True,default=gen_uuid)
    medplum_practitioner_id = Column(String,nullable=True,index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)
    specialization = Column(String,nullable=False)
    license_number= Column(String(25),nullable=False,unique=True)
    contact_person_name = Column(String(100), nullable=True)
    contact_email = Column(String(120), nullable=True)
    contact_phone = Column(String(30), nullable=True)
    # Cap on how many appointments this doctor accepts per calendar day; null = unlimited.
    max_appointments_per_day = Column(Integer, nullable=True)
    # Consultation fee; overrides the service's fee when this doctor is booked directly.
    fee = Column(Numeric(8, 2), nullable=True)
    years_of_practice = Column(Integer, nullable=True)
    # Comma-separated list, e.g. "English, Hindi, Punjabi".
    languages = Column(String(255), nullable=True)
    # Lower sorts first in the patient-facing doctor list; admin-set only.
    display_order = Column(Integer, nullable=False, default=0, server_default="0")
    # A submitted doctor application starts pending, and only shows up on a
    # profile / clinic once an admin approves it.
    status = Column(
        SAEnum(Status, name="doctor_profile_status"),
        nullable=False,
        default=Status.PENDING,
        server_default=Status.PENDING.name,
    )
    user = relationship("UserModel", back_populates="doctor_profile")
    # DEPRECATED: single-clinic FK, superseded by clinic_links (doctor_clinic).
    # Kept until existing callers are migrated.
    # FK must point at actual clinic model/table (CliniModel/"clinic"), not the nonexistent "Clinic"
    clinic_id = Column(UUID(as_uuid=False), ForeignKey("clinic.id"), nullable=True)
    clinic = relationship("CliniModel", back_populates="doctor_profiles")
    clinic_links = relationship("DoctorClinicModel", back_populates="doctor_profile", cascade="all, delete-orphan")
    availability_slots=relationship("doctorAvailabilityModel",back_populates="doctor_profile",cascade="all, delete-orphan")

    @property
    def effective_availability_slots(self):
        """The doctor's own weekly hours, or — if never set — the hours of
        whichever linked clinic has them, so setting hours on either the
        doctor or the clinic form makes the doctor bookable."""
        if self.availability_slots:
            return self.availability_slots
        for link in self.clinic_links:
            if link.clinic and link.clinic.availability_slots:
                return link.clinic.availability_slots
        return []

