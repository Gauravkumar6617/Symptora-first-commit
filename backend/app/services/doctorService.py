from sqlalchemy.orm import Session
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.userRepositories import UserRepository
from app.schemas.doctor import DoctorProfileCreate
from app.models.doctorModel import DoctorProfile
from app.models.enumModel import Status
from app.utils.integration.medplum.index import MedplumIntegration
from app.core.config import settings


class DoctorService:

    def __init__(self, db: Session):
        self.db = db
        self.doctor_repo = DoctorRepository(db)
        self.user_repo = UserRepository(db)
#for medplum integration and use
        self.medplum = MedplumIntegration(
            base_url=settings.MEDPLUM_BASE_URL,
            client_id=settings.MEDPLUM_CLIENT_ID,
            client_secret=settings.MEDPLUM_CLIENT_SECRET,
            project_id=settings.MEDPLUM_PROJECT_ID,
        )
#doct0r_data is ar in which pydantic is playing theri role
    def apply_to_become_doctor(self, user_id: str, doctor_data: DoctorProfileCreate) -> DoctorProfile:
        """Submit a doctor application. It stays pending until an admin approves it —
        nothing in Medplum is created and the user does not become a doctor yet."""
#first getting user id from user repo
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if user.id_doctor:
            raise ValueError("User is already a doctor")

        if self.doctor_repo.get_by_user_id(user_id):
            raise ValueError("A doctor application already exists for this user")

        return self.doctor_repo.create(user_id, doctor_data)

    def get_my_application(self, user_id: str) -> DoctorProfile | None:
        return self.doctor_repo.get_by_user_id(user_id)

    def list_pending_applications(self, admin_user) -> list[DoctorProfile]:
        if not admin_user.is_admin:
            raise PermissionError("Admin access required.")
        return self.doctor_repo.list_by_status(Status.PENDING)

    def approve_doctor(self, admin_user, doctor_profile_id: str) -> DoctorProfile:
        if not admin_user.is_admin:
            raise PermissionError("Admin access required.")

        doctor_profile = self.doctor_repo.get_by_id(doctor_profile_id)
        if not doctor_profile:
            raise ValueError("Doctor application not found")

        if doctor_profile.status != Status.PENDING:
            raise ValueError(f"Application is already {doctor_profile.status.value}")

        user = self.user_repo.get_user_by_id(doctor_profile.user_id)
        if not user:
            raise ValueError("User not found")

        # The Practitioner is only created in Medplum, and the user only
        # becomes a doctor, once an admin approves the application.
        practitioner = self.medplum.create_practitioner(
            doctor_profile, user.first_name, user.last_name
        )

        try:
            doctor_profile.status = Status.APPROVED
            doctor_profile.medplum_practitioner_id = practitioner["id"]
            user.id_doctor = True
            user.medplum_practitoner_id = practitioner["id"]  # matches UserModel's existing spelling
            self.db.commit()
            self.db.refresh(doctor_profile)
            return doctor_profile
        except Exception:
            self.db.rollback()
            raise

    def reject_doctor(self, admin_user, doctor_profile_id: str) -> DoctorProfile:
        if not admin_user.is_admin:
            raise PermissionError("Admin access required.")

        doctor_profile = self.doctor_repo.get_by_id(doctor_profile_id)
        if not doctor_profile:
            raise ValueError("Doctor application not found")

        if doctor_profile.status != Status.PENDING:
            raise ValueError(f"Application is already {doctor_profile.status.value}")

        doctor_profile.status = Status.REJECTED
        self.db.commit()
        self.db.refresh(doctor_profile)
        return doctor_profile
