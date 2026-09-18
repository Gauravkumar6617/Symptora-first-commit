"""Import ORM models so Alembic can register them in ``Base.metadata``."""

from app.models.base import BaseModel
from app.models.clinicModel import CliniModel
from app.models.doctorAvailabilityModel import doctorAvailabilityModel
from app.models.doctorModel import DoctorProfile
from app.models.familyMemeberModel import FamilyMemberModel
from app.models.userModel import UserModel

__all__ = [
    "BaseModel",
    "CliniModel",
    "DoctorProfile",
    "FamilyMemberModel",
    "UserModel",
    "doctorAvailabilityModel",
]
