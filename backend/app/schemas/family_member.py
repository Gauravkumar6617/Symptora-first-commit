from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.enumModel import FamilyRelationship
from app.schemas.common import ORMReadBase


class FamilyMemberBase(BaseModel):
    full_name: str = Field(max_length=50)
    email: Optional[EmailStr] = None
    profile: Optional[str] = None
    relationship_to_owner: Optional[FamilyRelationship] = None
    date_of_birth: datetime
    gender: Optional[str] = None


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=50)
    profile: Optional[str] = None
    relationship_to_owner: Optional[FamilyRelationship] = None
    gender: Optional[str] = None


class FamilyMemberRead(FamilyMemberBase, ORMReadBase):
    account_owner_id: str
