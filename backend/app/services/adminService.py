from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enumModel import Status
from app.repositories.clinicRepositories import ClinicRepository
from app.repositories.doctorClinicRepository import DoctorClinicRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.userRepositories import UserRepository
from app.schemas.clinic import ClinicBase, ClinicCreate, ClinicRead
from app.schemas.doctor import AdminDoctorRead
from app.utils.integration.medplum.index import MedplumIntegration


class AdminService:
    """Read-side aggregation + clinic creation for the admin dashboard.
    Like DoctorClinicService, this is the only layer allowed to reach
    across repositories."""

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.doctor_repo = DoctorRepository(db)
        self.clinic_repo = ClinicRepository(db)
        self.doctor_clinic_repo = DoctorClinicRepository(db)
        self.medplum = MedplumIntegration(
            base_url=settings.MEDPLUM_BASE_URL,
            client_id=settings.MEDPLUM_CLIENT_ID,
            client_secret=settings.MEDPLUM_CLIENT_SECRET,
            project_id=settings.MEDPLUM_PROJECT_ID,
        )

    def get_stats(self) -> dict:
        return {
            "patients": len(self.user_repo.list_patients()),
            "doctors": len(self.doctor_repo.list_by_status(Status.APPROVED)),
            "clinics": len(self.clinic_repo.list_all()),
            "pending_applications": len(self.doctor_repo.list_by_status(Status.PENDING)),
        }

    def list_patients(self):
        return self.user_repo.list_patients()

    def list_doctors(self) -> list[AdminDoctorRead]:
        doctors = self.doctor_repo.list_by_status(Status.APPROVED)
        out: list[AdminDoctorRead] = []
        for doctor in doctors:
            user = self.user_repo.get_user_by_id(doctor.user_id)
            links = self.doctor_clinic_repo.list_clinics_for_doctor(doctor.id)
            clinics = [self.clinic_repo.get_by_id(link.clinic_id) for link in links]
            out.append(
                AdminDoctorRead(
                    id=doctor.id,
                    created_at=doctor.created_at,
                    updated_at=doctor.updated_at,
                    user_id=doctor.user_id,
                    specialization=doctor.specialization,
                    license_number=doctor.license_number,
                    medplum_practitioner_id=doctor.medplum_practitioner_id,
                    clinic_id=doctor.clinic_id,
                    status=doctor.status,
                    first_name=user.first_name if user else "",
                    last_name=user.last_name if user else "",
                    email=user.email if user else "",
                    clinics=[ClinicRead.model_validate(c) for c in clinics if c],
                )
            )
        return out

    def list_clinics(self) -> list:
        return self.clinic_repo.list_all()

    def create_clinic(self, clinic_data: ClinicBase):
        # The Organization is created in Medplum first, so a Medplum failure
        # never leaves an orphaned local row (same rule as elsewhere).
        organisation = self.medplum.create_organisation(clinic_data)
        full_data = ClinicCreate(
            **clinic_data.model_dump(),
            medplum_organisation_id=organisation["id"],
        )
        return self.clinic_repo.createClinic(full_data)
