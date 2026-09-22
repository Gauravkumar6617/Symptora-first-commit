from sqlalchemy.orm import Session
from app.repositories.clinicRepositories import ClinicRepository
from app.schemas.clinic import ClinicCreate,ClinicRead,ClinicUpdate
from app.core.config import settings
from app.utils.integration.medplum.index import MedplumIntegration
from app.repositories.doctorRepositories import DoctorRepository
class CliniService:

    def __init__(self, db: Session):
        self.db = db
        self.doctor_repo = DoctorRepository(db)
        self.clinic_repo = ClinicRepository(db)
#for medplum integration and use
        self.medplum = MedplumIntegration(
            base_url=settings.MEDPLUM_BASE_URL,
            client_id=settings.MEDPLUM_CLIENT_ID,
            client_secret=settings.MEDPLUM_CLIENT_SECRET,
            project_id=settings.MEDPLUM_PROJECT_ID,
        )

    def list_clinics(self) -> list:
        return self.clinic_repo.list_all()
