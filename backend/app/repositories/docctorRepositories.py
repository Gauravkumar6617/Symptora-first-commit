from app.models.doctorModel import  DoctorProfile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.doctor import DoctorProfileCreate
from app.repositories.userRepositories import UserRepository
class DoctorRepositories:

    def __init__(self,db:Session,user_repo=UserRepository):
        self.db=db
        self.user_repo=UserRepository(db)


    def updateToDocctor(self,user_id:str,doctor_data:DoctorProfileCreate):
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            return None
        # Check if already a doctor
        if user.is_doctor:
            raise ValueError("User is already a doctor")

    # Check existing profile as an extra safety measure
        existing_profile = (
        self.db.query(DoctorProfile)
            .filter(DoctorProfile.user_id == user_id)
                .first()
        )

        if existing_profile:
            raise ValueError("Doctor profile already exists")

        user.id_doctor=True

        doctor_profile = DoctorProfile(
        user_id=user_id,
        specialization=doctor_data.specialization,
        license_number=doctor_data.license_number,
        medplum_practitioner_id=doctor_data.medplum_practitioner_id,
        clinic_id=doctor_data.clinic_id,
    )

        self.db.add(doctor_profile)

        try:
            self.db.commit(doctor_profile)
            self.db.refresh(doctor_profile)

            return doctor_profile

        except Exception:
            self.db.rollback()
        raise
