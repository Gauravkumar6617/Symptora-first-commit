from sqlalchemy import String,Column,Integer,ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import BaseModel
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

    medplum_organisation_id= Column(String(),nullable=False)

    doctor_profile =relationship("DoctorProfile",back_populates="clinic")