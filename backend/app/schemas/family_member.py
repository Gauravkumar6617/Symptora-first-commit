from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, computed_field

from app.models.enumModel import FamilyRelationship
from app.schemas.common import ORMReadBase


class FamilyMemberBase(BaseModel):
    full_name: str = Field(max_length=50)
    email: Optional[EmailStr] = None
    # Same details the member will log in with once they accept the invite.
    number: Optional[str] = Field(default=None, max_length=15)
    profile: Optional[str] = None
    relationship_to_owner: Optional[FamilyRelationship] = None
    date_of_birth: datetime
    gender: Optional[str] = None


class FamilyMemberCreate(FamilyMemberBase):
    pass


class FamilyMemberUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=50)
    email: Optional[EmailStr] = None
    number: Optional[str] = Field(default=None, max_length=15)
    profile: Optional[str] = None
    relationship_to_owner: Optional[FamilyRelationship] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None


class FamilyMemberRead(FamilyMemberBase, ORMReadBase):
    account_owner_id: str
    medplum_patient_id: Optional[str] = None
    linked_user_id: Optional[str] = None

    @computed_field
    @property
    def has_account(self) -> bool:
        """True once the member has activated their own login."""
        return self.linked_user_id is not None


class FamilyInviteResponse(BaseModel):
    detail: str
    has_account: bool
