import logging
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enumModel import Status
from app.repositories.clinicRepositories import ClinicRepository
from app.repositories.doctorClinicRepository import DoctorClinicRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.serviceRepository import ServiceRepository
from app.repositories.telemedicineRepository import TelemedicineRepository
from app.repositories.userRepositories import UserRepository
from app.models.clinicModel import CliniModel
from app.models.doctorModel import DoctorProfile
from app.models.serviceModel import ServiceModel
from app.schemas.clinic import AdminClinicRead, ClinicBase, ClinicCreate, ClinicRead, ClinicUpdate
from app.schemas.doctor import AdminDoctorRead, DoctorProfileUpdate
from app.schemas.service import ServiceCreate, ServiceUpdate
from app.utils.integration.cloudflarR2.index import delete_key, file_url, upload_image
from app.utils.integration.medplum.index import MedplumIntegration

logger = logging.getLogger(__name__)


class ClinicNotFoundError(Exception):
    pass


class DoctorNotFoundError(Exception):
    pass


class ServiceNotFoundError(Exception):
    pass


def clinic_doctors(clinic: CliniModel) -> list[dict]:
    """Approved doctors linked to a clinic, for the admin list and public directory."""
    doctors = []
    for link in clinic.doctor_links:
        profile: DoctorProfile = link.doctor_profile
        if profile is None or profile.status != Status.APPROVED or profile.user is None:
            continue
        doctors.append({
            "id": profile.id,
            "name": f"Dr. {profile.user.first_name} {profile.user.last_name}".strip(),
            "specialization": profile.specialization,
            "fee": float(profile.fee) if profile.fee is not None else None,
            "avatar_url": file_url(profile.user.avatar) if profile.user.avatar else None,
            "years_of_practice": profile.years_of_practice,
            "languages": profile.languages,
            "_display_order": profile.display_order or 0,
        })
    doctors.sort(key=lambda d: (d["_display_order"], d["name"]))
    for d in doctors:
        del d["_display_order"]
    return doctors


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
        self.service_repo = ServiceRepository(db)
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
            **TelemedicineRepository(self.db).earnings(),
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
                    contact_person_name=doctor.contact_person_name,
                    contact_email=doctor.contact_email,
                    contact_phone=doctor.contact_phone,
                    max_appointments_per_day=doctor.max_appointments_per_day,
                    fee=float(doctor.fee) if doctor.fee is not None else None,
                    years_of_practice=doctor.years_of_practice,
                    languages=doctor.languages,
                    display_order=doctor.display_order,
                    availability_slots=doctor.availability_slots,
                    first_name=user.first_name if user else "",
                    last_name=user.last_name if user else "",
                    email=user.email if user else "",
                    clinics=[ClinicRead.model_validate(c) for c in clinics if c],
                )
            )
        return out

    def update_doctor(self, doctor_id: str, data: DoctorProfileUpdate) -> DoctorProfile:
        doctor = self._get_doctor(doctor_id)
        changes = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        if not changes:
            return doctor
        availability_slots = changes.pop("availability_slots", None)
        for clearable in ("contact_person_name", "contact_email", "contact_phone", "medplum_practitioner_id", "languages"):
            if changes.get(clearable) == "":
                changes[clearable] = None
        if changes:
            doctor = self.doctor_repo.update(doctor, changes)
        if availability_slots is not None:
            doctor = self.doctor_repo.replace_availability(doctor, availability_slots)
        return doctor

    def list_clinics(self) -> list[AdminClinicRead]:
        return [
            AdminClinicRead.model_validate(
                {**ClinicRead.model_validate(c).model_dump(), "doctors": clinic_doctors(c)}
            )
            for c in self.clinic_repo.list_all()
        ]

    def upload_clinic_picture(self, file: UploadFile) -> dict:
        key = upload_image(file, "clinics")
        return {"picture": key, "picture_url": file_url(key)}

    def create_clinic(self, clinic_data: ClinicBase):
        if self.clinic_repo.get_by_name(clinic_data.name):
            raise ValueError("A clinic with this name already exists.")
        # The Organization is created in Medplum first, so a Medplum failure
        # never leaves an orphaned local row (same rule as elsewhere).
        organisation = self.medplum.create_organisation(clinic_data)
        full_data = ClinicCreate(
            **clinic_data.model_dump(),
            medplum_organisation_id=organisation["id"],
        )
        return self.clinic_repo.createClinic(full_data)

    def update_clinic(self, clinic_id: str, data: ClinicUpdate):
        clinic = self._get(clinic_id)
        changes = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        if not changes:
            return clinic
        availability_slots = changes.pop("availability_slots", None)
        for clearable in (
            "description", "address", "phone", "opening_hours",
            "contact_person_name", "contact_email", "contact_phone",
        ):
            if changes.get(clearable) == "":
                changes[clearable] = None
        if "name" in changes:
            clash = self.clinic_repo.get_by_name(changes["name"])
            if clash and clash.id != clinic.id:
                raise ValueError("A clinic with this name already exists.")
        old_picture = clinic.picture

        if changes:
            # Medplum first, like create: if it refuses, nothing changes locally.
            merged = ClinicBase.model_validate({**ClinicRead.model_validate(clinic).model_dump(), **changes})
            self.medplum.update_organisation(clinic.medplum_organisation_id, merged)
            clinic = self.clinic_repo.update(clinic, changes)

        if availability_slots is not None:
            clinic = self.clinic_repo.replace_availability(clinic, availability_slots)

        if "picture" in changes and old_picture != clinic.picture:
            self._delete_picture(old_picture)
        return clinic

    def delete_clinic(self, clinic_id: str) -> None:
        """Remove a clinic, unlinking its doctors, here and in Medplum."""
        clinic = self._get(clinic_id)
        role_ids = [l.medplum_practitioner_role_id for l in clinic.doctor_links if l.medplum_practitioner_role_id]
        for profile in list(clinic.doctor_profiles):
            profile.clinic_id = None  # deprecated single-clinic FK
        picture, organisation_id = clinic.picture, clinic.medplum_organisation_id
        self.clinic_repo.delete(clinic)  # doctor_links cascade

        # The clinic is gone for Symptora either way; Medplum cleanup is best effort.
        for role_id in role_ids:
            try:
                self.medplum.delete_resource("PractitionerRole", role_id)
            except Exception:
                logger.exception("PractitionerRole %s not deleted in Medplum", role_id)
        try:
            self.medplum.delete_resource("Organization", organisation_id)
        except Exception:
            logger.exception("Organization %s not deleted in Medplum", organisation_id)
        self._delete_picture(picture)

    def list_services(self) -> list[ServiceModel]:
        return self.service_repo.list_all()

    def create_service(self, data: ServiceCreate) -> ServiceModel:
        if self.service_repo.get_by_name(data.name):
            raise ValueError("A service with this name already exists.")
        return self.service_repo.create(data)

    def update_service(self, service_id: str, data: ServiceUpdate) -> ServiceModel:
        service = self._get_service(service_id)
        changes = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        if not changes:
            return service
        if changes.get("description") == "":
            changes["description"] = None
        if "name" in changes:
            clash = self.service_repo.get_by_name(changes["name"])
            if clash and clash.id != service.id:
                raise ValueError("A service with this name already exists.")
        return self.service_repo.update(service, changes)

    def delete_service(self, service_id: str) -> None:
        self.service_repo.delete(self._get_service(service_id))

    def _get_service(self, service_id: str) -> ServiceModel:
        try:
            UUID(service_id)
        except ValueError:
            raise ServiceNotFoundError()
        service = self.service_repo.get_by_id(service_id)
        if service is None:
            raise ServiceNotFoundError()
        return service

    def _get_doctor(self, doctor_id: str) -> DoctorProfile:
        try:
            UUID(doctor_id)
        except ValueError:
            raise DoctorNotFoundError()
        doctor = self.doctor_repo.get_by_id(doctor_id)
        if doctor is None:
            raise DoctorNotFoundError()
        return doctor

    def _get(self, clinic_id: str) -> CliniModel:
        try:
            UUID(clinic_id)
        except ValueError:
            raise ClinicNotFoundError()
        clinic = self.clinic_repo.get_by_id(clinic_id)
        if clinic is None:
            raise ClinicNotFoundError()
        return clinic

    @staticmethod
    def _delete_picture(key: str | None) -> None:
        if key and not key.startswith("http"):
            try:
                delete_key(key)
            except Exception:
                logger.exception("Old clinic picture %s not deleted", key)
