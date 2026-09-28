from pydantic import BaseModel

from app.models.enumModel import DayOfWeek, TimeSlot
from app.schemas.common import ORMReadBase


class ClinicAvailabilityBase(BaseModel):
    days: DayOfWeek
    slot: TimeSlot


class ClinicAvailabilityCreate(ClinicAvailabilityBase):
    pass


class ClinicAvailabilityRead(ClinicAvailabilityBase, ORMReadBase):
    clinic_id: str
