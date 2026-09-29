import logging

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.enumModel import ConsultationStatus, Status
from app.models.telemedicineModel import TelemedicineConsultationModel
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.familyMemberRepository import FamilyMemberRepository
from app.repositories.telemedicineRepository import TelemedicineRepository
from app.schemas.telemedicine import TelemedicineStart
from app.services.familyMemberService import FamilyMemberService
from app.utils.integration.medplum.index import MedplumIntegration

logger = logging.getLogger(__name__)


class TelemedicineService:

    def __init__(self, db: Session):
        self.db = db
        self.repo = TelemedicineRepository(db)
        self.doctor_repo = DoctorRepository(db)
        self.family_repo = FamilyMemberRepository(db)

    def start(self, patient, data: TelemedicineStart) -> TelemedicineConsultationModel:
        if patient.is_admin or self.doctor_repo.get_by_user_id(patient.id):
            raise PermissionError("Only patients can start an instant video consultation")
        if data.family_member_id and not self.family_repo.get_for_owner(patient.id, data.family_member_id):
            raise ValueError("Family member not found")
        return self._label(self.repo.create(patient.id, data))

    def accept(self, doctor_user, consultation_id: str) -> TelemedicineConsultationModel:
        doctor = self.doctor_repo.get_by_user_id(doctor_user.id)
        if not doctor or doctor.status != Status.APPROVED:
            raise PermissionError("Only an approved doctor can accept a consultation")
        if not self.repo.claim(consultation_id, doctor.id):
            raise ValueError("This consultation was already taken or is no longer pending")
        return self._label(self.repo.get_by_id(consultation_id))

    def cancel(self, consultation_id: str, current_user) -> TelemedicineConsultationModel:
        consultation = self.repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        is_owner = consultation.patient_id == current_user.id
        is_treating_doctor = doctor is not None and doctor.id == consultation.doctor_profile_id
        if not (is_owner or is_treating_doctor or current_user.is_admin):
            raise PermissionError("Not allowed to cancel this consultation")
        if consultation.status in (ConsultationStatus.CANCELLED, ConsultationStatus.COMPLETED):
            raise ValueError("This consultation has already finished")
        consultation.status = ConsultationStatus.CANCELLED
        return self._label(self.repo.save(consultation))

    def complete(self, consultation_id: str, current_user) -> TelemedicineConsultationModel:
        consultation = self.repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        is_owner = consultation.patient_id == current_user.id
        is_treating_doctor = doctor is not None and doctor.id == consultation.doctor_profile_id
        if not (is_owner or is_treating_doctor):
            raise PermissionError("Not allowed to end this consultation")
        if consultation.status == ConsultationStatus.IN_PROGRESS:
            consultation.status = ConsultationStatus.COMPLETED
            self.repo.save(consultation)
        return self._label(consultation)

    def get_for_user(self, consultation_id: str, current_user) -> TelemedicineConsultationModel:
        """Read access for whoever is allowed to be in this call's waiting room."""
        consultation = self.repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        is_owner = consultation.patient_id == current_user.id
        is_treating_doctor = doctor is not None and doctor.id == consultation.doctor_profile_id
        if not (is_owner or is_treating_doctor or current_user.is_admin):
            raise PermissionError("Not allowed to view this consultation")
        return self._label(consultation)

    def list_pending_for_doctor(self, current_user) -> list[TelemedicineConsultationModel]:
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        if not doctor or doctor.status != Status.APPROVED:
            raise PermissionError("Only an approved doctor can view the consultation queue")
        return [self._label(c) for c in self.repo.list_pending()]

    def _label(self, consultation: TelemedicineConsultationModel) -> TelemedicineConsultationModel:
        doctor = consultation.doctor_profile
        consultation.doctor_name = self._doctor_display_name(doctor) if doctor else None
        consultation.doctor_specialization = doctor.specialization if doctor else None
        consultation.patient_name = self._patient_display_name(consultation)
        return consultation

    @staticmethod
    def _doctor_display_name(doctor) -> str | None:
        if not doctor or not doctor.user:
            return None
        return f"Dr. {doctor.user.first_name} {doctor.user.last_name}"

    @staticmethod
    def _patient_display_name(consultation: TelemedicineConsultationModel) -> str | None:
        if consultation.family_member:
            return consultation.family_member.full_name
        if consultation.patient:
            return f"{consultation.patient.first_name} {consultation.patient.last_name}".strip()
        return None


def consultation_encounter(consultation: TelemedicineConsultationModel, patient_id: str, practitioner_id: str) -> dict:
    """The accepted consultation as a FHIR Encounter (virtual, in-progress)."""
    return {
        "resourceType": "Encounter",
        "status": "in-progress",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "VR",
            "display": "virtual",
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "participant": [{"individual": {"reference": f"Practitioner/{practitioner_id}"}}],
        "reasonCode": [{"text": consultation.reason}],
    }


def sync_consultation_to_medplum(consultation_id: str, medplum: MedplumIntegration) -> None:
    """Background task: record the accepted consultation as an Encounter.

    Best effort, like every other Medplum sync in this app — Medplum being
    down never blocks or unwinds the consultation itself."""
    db = SessionLocal()
    try:
        consultation = db.get(TelemedicineConsultationModel, consultation_id)
        if consultation is None or consultation.doctor_profile is None:
            return
        practitioner_id = consultation.doctor_profile.medplum_practitioner_id
        if not practitioner_id:
            logger.warning("Consultation %s not sent to Medplum: doctor has no Medplum id", consultation_id)
            return

        if consultation.family_member is not None:
            patient_id = FamilyMemberService(db, medplum).ensure_medplum_patient(
                consultation.family_member, consultation.patient
            )
        else:
            patient_id = consultation.patient.medplum_patient_id
        if not patient_id:
            logger.warning("Consultation %s not sent to Medplum: patient has no Medplum id", consultation_id)
            return

        created = medplum.create_resource(consultation_encounter(consultation, patient_id, practitioner_id))
        consultation.medplum_encounter_id = created.get("id")
        db.commit()
    except Exception:
        logger.exception("Consultation %s not sent to Medplum", consultation_id)
    finally:
        db.close()
