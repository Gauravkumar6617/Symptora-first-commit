"""Import ORM models so Alembic can register them in ``Base.metadata``."""

from app.models.base import BaseModel
from app.models.appointmentModel import AppointmentModel
from app.models.blogModel import BlogPostModel
from app.models.clinicModel import CliniModel, ClinicAvailabilityModel
from app.models.doctorClinicModel import DoctorClinicModel
from app.models.doctorAvailabilityModel import doctorAvailabilityModel
from app.models.doctorModel import DoctorProfile
from app.models.familyMemeberModel import FamilyMemberModel
from app.models.serviceModel import ServiceModel
from app.models.symptomCheckModel import SymptomCheckModel
from app.models.userModel import UserModel

__all__ = [
    "BaseModel",
    "AppointmentModel",
    "BlogPostModel",
    "CliniModel",
    "ClinicAvailabilityModel",
    "DoctorClinicModel",
    "DoctorProfile",
    "FamilyMemberModel",
    "ServiceModel",
    "SymptomCheckModel",
    "UserModel",
    "doctorAvailabilityModel",
]
