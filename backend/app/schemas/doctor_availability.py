from pydantic import BaseModel

from app.models.enumModel import DayOfWeek, TimeSlot
from app.schemas.common import ORMReadBase


class DoctorAvailabilityBase(BaseModel):
    days: DayOfWeek
    slot: TimeSlot


class DoctorAvailabilityCreate(DoctorAvailabilityBase):
    pass


class DoctorAvailabilityRead(DoctorAvailabilityBase, ORMReadBase):
    doctor_profile_id: str
