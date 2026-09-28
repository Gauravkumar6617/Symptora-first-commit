from sqlalchemy import String,Column,Integer,ForeignKey,Enum
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
from app.models.enumModel import DayOfWeek, TimeSlot
import uuid
from sqlalchemy.orm import relationship
def gen_uuid():
    #Generates a fresh random unique ID string for a new row's primary key
    return str(uuid.uuid4())

class CliniModel(BaseModel):

    __tablename__="clinic"

    id = Column(UUID(as_uuid=False),primary_key=True,index=True,default=gen_uuid)

    name = Column(String(50),nullable=False,unique=True)
    picture=Column(String(),nullable=False)
    description= Column(String(255),nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    opening_hours = Column(String(120), nullable=True)
    contact_person_name = Column(String(100), nullable=True)
    contact_email = Column(String(120), nullable=True)
    contact_phone = Column(String(30), nullable=True)

    medplum_organisation_id= Column(String(),nullable=False)

    # back_populates target renamed to match DoctorProfile.clinic
    # DEPRECATED: pairs with DoctorProfile.clinic_id; use doctor_links instead.
    doctor_profiles = relationship("DoctorProfile", back_populates="clinic")
    doctor_links = relationship("DoctorClinicModel", back_populates="clinic", cascade="all, delete-orphan")
    availability_slots = relationship(
        "ClinicAvailabilityModel", back_populates="clinic", cascade="all, delete-orphan"
    )


class ClinicAvailabilityModel(BaseModel):
    """Mirrors doctorAvailabilityModel: one row per (day, AM/PM slot) the clinic is open."""

    __tablename__ = "clinic_availability"

    id = Column(UUID(as_uuid=False), index=True, primary_key=True, default=gen_uuid)
    clinic_id = Column(UUID(as_uuid=False), ForeignKey("clinic.id"), nullable=False)

    days = Column(Enum(DayOfWeek), nullable=False)
    slot = Column(Enum(TimeSlot), nullable=False)

    clinic = relationship("CliniModel", back_populates="availability_slots")