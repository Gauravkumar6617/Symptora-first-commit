from sqlalchemy import String,Boolean,Column,ForeignKey,Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import BaseModel
from app.models.enumModel import DayOfWeek,TimeSlot

def gen_uuid():
    return str(uuid.uuid4())

class doctorAvailabilityModel(BaseModel):
    __tablename__="doctor_availability"

    id=Column(UUID(as_uuid=False),index=True,primary_key=True,default=gen_uuid)
    doctor_profile_id=Column(UUID(as_uuid=False),ForeignKey("doctor_profiles.id"),nullable=False)

    days=Column(Enum(DayOfWeek),nullable=False)
    slot=Column(Enum(TimeSlot),nullable=False)

    doctor_profile=relationship("DoctorProfile",back_populates="availability_slots")


