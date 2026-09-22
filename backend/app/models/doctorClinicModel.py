from sqlalchemy import String,Column,ForeignKey,UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import BaseModel

def gen_uuid():
    return str(uuid.uuid4())

class DoctorClinicModel(BaseModel):
    # Association object linking a doctor to each clinic they work at; mirrors
    # a PractitionerRole in Medplum.
    __tablename__="doctor_clinic"
    __table_args__=(
        UniqueConstraint("doctor_profile_id","clinic_id",name="uq_doctor_clinic_doctor_profile_id_clinic_id"),
    )

    id=Column(UUID(as_uuid=False),primary_key=True,index=True,default=gen_uuid)
    doctor_profile_id=Column(UUID(as_uuid=False),ForeignKey("doctor_profiles.id"),nullable=False,index=True)
    clinic_id=Column(UUID(as_uuid=False),ForeignKey("clinic.id"),nullable=False,index=True)
    medplum_practitioner_role_id=Column(String,nullable=True)

    doctor_profile=relationship("DoctorProfile",back_populates="clinic_links")
    clinic=relationship("CliniModel",back_populates="doctor_links")
