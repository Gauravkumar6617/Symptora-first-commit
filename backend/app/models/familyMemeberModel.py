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
    email=Column(String(40),unique=True,nullable=True)
    profile=Column(String,nullable=True)
    relationship_to_owner = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(String, nullable=True)


    account_owner=relationship("UserModel",back_populates="family_members" )