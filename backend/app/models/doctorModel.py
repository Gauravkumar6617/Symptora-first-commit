from sqlalchemy import String,Column,Integer,Boolean,ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
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
