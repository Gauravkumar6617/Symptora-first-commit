from sqlalchemy.orm import Session
from app.models.doctorModel import DoctorProfile
from app.models.enumModel import Status
from app.schemas.doctor import DoctorProfileCreate


class DoctorRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: str) -> DoctorProfile | None:
        return (
            self.db.query(DoctorProfile)
            .filter(DoctorProfile.user_id == user_id)
            .first()
        )

    def get_by_id(self, doctor_profile_id: str) -> DoctorProfile | None:
        return (
            self.db.query(DoctorProfile)
            .filter(DoctorProfile.id == doctor_profile_id)
            .first()
        )

    def list_by_status(self, status: Status) -> list[DoctorProfile]:
        return (
            self.db.query(DoctorProfile)
            .filter(DoctorProfile.status == status)
            .all()
        )

    def create(self, user_id: str, doctor_data: DoctorProfileCreate) -> DoctorProfile:
        # Every application starts pending — it only becomes a real doctor
        # profile (and shows up with its clinic) once an admin approves it.
        doctor_profile = DoctorProfile(
            user_id=user_id,
            specialization=doctor_data.specialization,
            license_number=doctor_data.license_number,
            medplum_practitioner_id=doctor_data.medplum_practitioner_id,
            clinic_id=doctor_data.clinic_id,
            status=Status.PENDING,
        )
        self.db.add(doctor_profile)
        self.db.commit()
        self.db.refresh(doctor_profile)
        return doctor_profile
