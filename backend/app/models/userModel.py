from sqlalchemy import String,Column ,Boolean,DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
import uuid
from sqlalchemy.orm import relationship

def gen_uuid():
    #Generates a fresh random unique ID string for a new row's primary key
    return str(uuid.uuid4())

class UserModel(BaseModel):

    __tablename__="users"

    id=Column(UUID(as_uuid=False),primary_key=True,default=gen_uuid,index=True)
    first_name=Column(String(24),nullable=False)
    last_name=Column(String(24),nullable=False)
    email=Column(String(50),unique=True,nullable=False,index=True)
    number=Column(String(15),nullable=False,index=True)
    address=Column(String(255),nullable=True)
    avatar=Column(String,nullable=True)
    hashed_password=Column(String,nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    is_active=Column(Boolean,default=False)
    gender = Column(String, nullable=True)
    id_doctor=Column(Boolean,default=False,nullable=False)
    medplum_patient_id=Column(String,nullable=True,index=True)
    medplum_practitoner_id=Column(String,nullable=True,index=True)
    is_admin=Column(Boolean,default=False)

    family_members=relationship("FamilyMemberModel",back_populates="account_owner")
    doctor_profile=relationship("DoctorProfile",back_populates="user",uselist=False,cascade="all ,delete-orphan")


