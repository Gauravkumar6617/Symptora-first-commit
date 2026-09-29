from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

from app.utils.integration.cloudflarR2.index import file_url

from app.schemas.clinic_availability import ClinicAvailabilityCreate, ClinicAvailabilityRead
from app.schemas.common import ORMReadBase


class ClinicBase(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    # R2 key from POST /admin/clinics/picture, or an absolute image url.
    picture: str = Field(min_length=1)
    description: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = Field(default=None, max_length=120)
    contact_person_name: Optional[str] = Field(default=None, max_length=100)
    contact_email: Optional[str] = Field(default=None, max_length=120)
    contact_phone: Optional[str] = Field(default=None, max_length=30)
    availability_slots: Optional[List[ClinicAvailabilityCreate]] = None


class ClinicCreate(ClinicBase):
    medplum_organisation_id: str


class ClinicUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    picture: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = Field(default=None, max_length=120)
    contact_person_name: Optional[str] = Field(default=None, max_length=100)
    contact_email: Optional[str] = Field(default=None, max_length=120)
    contact_phone: Optional[str] = Field(default=None, max_length=30)
    availability_slots: Optional[List[ClinicAvailabilityCreate]] = None


class ClinicRead(ClinicBase, ORMReadBase):
    medplum_organisation_id: str
    # Presigned, short-lived download url derived from ``picture``.
    picture_url: Optional[str] = None
    availability_slots: List[ClinicAvailabilityRead] = []

    @model_validator(mode="after")
    def _attach_picture_url(self):
        if self.picture and not self.picture_url:
            self.picture_url = file_url(self.picture)
        return self


class ClinicDoctor(BaseModel):
    id: str  # doctor profile id
    name: str
    specialization: str
    fee: Optional[float] = None
    avatar_url: Optional[str] = None
    years_of_practice: Optional[int] = None
    languages: Optional[str] = None


class AdminClinicRead(ClinicRead):
    doctors: List[ClinicDoctor] = []


class PublicClinicRead(BaseModel):
    """GET /clinics/directory — what anyone may see about a partner clinic."""

    id: str
    name: str
    picture_url: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[str] = None
    availability_slots: List[ClinicAvailabilityRead] = []
    doctors: List[ClinicDoctor] = []


class ClinicPictureUpload(BaseModel):
    picture: str  # the key to send as ClinicBase.picture
    picture_url: str  # preview url


class DoctorClinicRead(ORMReadBase):
    doctor_profile_id: str
    clinic_id: str
    medplum_practitioner_role_id: Optional[str] = None
