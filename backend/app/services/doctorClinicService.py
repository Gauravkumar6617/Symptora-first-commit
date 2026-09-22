from sqlalchemy.orm import Session
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.clinicRepositories import ClinicRepository
from app.repositories.doctorClinicRepository import DoctorClinicRepository
from app.repositories.userRepositories import UserRepository
from app.models.doctorClinicModel import DoctorClinicModel
from app.utils.integration.medplum.index import MedplumIntegration
from app.core.config import settings


class DoctorClinicService:

    def __init__(self, db: Session):
        self.db = db
        self.doctor_repo = DoctorRepository(db)
        self.clinic_repo = ClinicRepository(db)
        self.doctor_clinic_repo = DoctorClinicRepository(db)
        self.user_repo = UserRepository(db)
        self.medplum = MedplumIntegration(
            base_url=settings.MEDPLUM_BASE_URL,
            client_id=settings.MEDPLUM_CLIENT_ID,
            client_secret=settings.MEDPLUM_CLIENT_SECRET,
            project_id=settings.MEDPLUM_PROJECT_ID,
        )

    def assign_doctor_to_clinic(self, user_id: str, clinic_id: str) -> DoctorClinicModel:
        user = self.user_repo.get_user_by_id(user_id)
        if not user or not user.id_doctor:
            raise PermissionError("Only approved doctors can be assigned to a clinic.")

        doctor_profile = self.doctor_repo.get_by_user_id(user_id)
        if not doctor_profile:
            raise ValueError("Doctor profile not found")

        if not doctor_profile.medplum_practitioner_id:
            raise ValueError("Doctor has no Medplum practitioner record")

        clinic = self.clinic_repo.get_by_id(clinic_id)
        if not clinic:
            raise ValueError("Clinic not found")

        if self.doctor_clinic_repo.get_by_doctor_and_clinic(doctor_profile.id, clinic.id):
            raise ValueError("Doctor is already assigned to this clinic")

        # Create the PractitionerRole in Medplum first, so a Medplum failure
        # never leaves an orphaned local row.
        practitioner_role = self.medplum.create_practitioner_role(
            doctor_profile.medplum_practitioner_id, clinic.medplum_organisation_id
        )

        try:
            return self.doctor_clinic_repo.create(
                doctor_profile.id, clinic.id, practitioner_role["id"]
            )
        except Exception:
            self.db.rollback()
            raise

    def list_my_clinics(self, user_id: str) -> list[DoctorClinicModel]:
        doctor_profile = self.doctor_repo.get_by_user_id(user_id)
        if not doctor_profile:
            raise ValueError("Doctor profile not found")
        return self.doctor_clinic_repo.list_clinics_for_doctor(doctor_profile.id)
