from sqlalchemy import String,Column,Boolean,Integer,ForeignKey,DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.enumModel import FamilyRelationship
from app.models.base import BaseModel


def gen_uuid():
    return str(uuid.uuid4())

class FamilyMemberModel(BaseModel):
    __tablename__="family_members"

    id = Column(UUID(as_uuid=False),primary_key=True,index=True,default=gen_uuid)
    account_owner_id=Column(UUID(as_uuid=False),ForeignKey("users.id"),nullable=False,index=True)
    full_name=Column(String(50),nullable=False,index=True)
    # Unique per owner only (checked in the service): two relatives can both add grandma.
    email=Column(String(255),nullable=True,index=True)
    number=Column(String(15),nullable=True)
    profile=Column(String,nullable=True)
    relationship_to_owner = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(String, nullable=True)
    # Each member is their own FHIR Patient, like a normal user.
    medplum_patient_id=Column(String,nullable=True,index=True)
    # Set once the member activates their own account from the invite.
    linked_user_id=Column(UUID(as_uuid=False),ForeignKey("users.id",ondelete="SET NULL"),nullable=True,index=True)


    account_owner=relationship("UserModel",back_populates="family_members",foreign_keys=[account_owner_id])
    linked_user=relationship("UserModel",foreign_keys=[linked_user_id])
