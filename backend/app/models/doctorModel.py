from sqlalchemy import String,Column,Integer,Boolean,ForeignKey,Enum as SAEnum
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
    
