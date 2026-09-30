import logging

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.enumModel import ConsultationStatus, Status
from app.models.telemedicineModel import TelemedicineConsultationModel
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.familyMemberRepository import FamilyMemberRepository
from app.repositories.telemedicineRepository import TelemedicineRepository
from app.schemas.telemedicine import TelemedicineStart
from app.services import paymentService as payments
from app.services.familyMemberService import FamilyMemberService
from app.core.config import settings
from app.utils.integration.medplum.index import MedplumIntegration
from app.utils.otp.send_otp import send_consultation_email

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
        return self._label(self._priced(self.repo.create(patient.id, data)))

    def escalate(self, patient, family_member, reason: str, symptom_check_id: str) -> TelemedicineConsultationModel:
        """Auto-create a consultation for a High risk symptom check —
        skips the manual "start" form; the patient just gets a live queue
        entry every available doctor is immediately notified about."""
        if patient.is_admin or self.doctor_repo.get_by_user_id(patient.id):
            raise PermissionError("Only patients can be escalated to an instant consultation")
        return self._label(self._priced(
            self.repo.create_escalated(patient.id, family_member.id if family_member else None, reason, symptom_check_id)
        ))

    def _priced(self, consultation: TelemedicineConsultationModel) -> TelemedicineConsultationModel:
        consultation.amount = settings.TELEMEDICINE_FEE
        return self.repo.save(consultation)

    def _own_unpaid(self, consultation_id: str, patient) -> TelemedicineConsultationModel:
        consultation = self.repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        if consultation.patient_id != patient.id:
            raise PermissionError("Only the patient who started this consultation can pay for it")
        if consultation.status != ConsultationStatus.PENDING:
            raise ValueError("This consultation is no longer waiting for payment")
        return consultation

    def create_payment(self, patient, consultation_id: str) -> dict:
        consultation = self._own_unpaid(consultation_id, patient)
        order = payments.create_order(consultation)
        self.repo.save(consultation)
        return order

    def confirm_payment(self, patient, consultation_id: str, order_id: str, payment_id: str, signature: str | None):
        """True the first time it becomes paid (so the caller notifies doctors once)."""
        consultation = self._own_unpaid(consultation_id, patient)
        was_paid = consultation.paid_at is not None
        payments.verify(consultation, order_id, payment_id, signature)
        self.repo.save(consultation)
        return self._label(consultation), not was_paid

    def accept(self, doctor_user, consultation_id: str) -> TelemedicineConsultationModel:
        doctor = self.doctor_repo.get_by_user_id(doctor_user.id)
        if not doctor or doctor.status != Status.APPROVED:
            raise PermissionError("Only an approved doctor can accept a consultation")
        if not self.repo.claim(consultation_id, doctor.id):
            raise ValueError("This consultation was already taken, is not paid yet, or is no longer pending")
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
        # ponytail: paid-then-cancelled needs a manual refund from the Razorpay dashboard; automate if volume grows.
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

    def list_for_patient(self, patient_id: str) -> list[TelemedicineConsultationModel]:
        return [self._label(c) for c in self.repo.list_for_patient(patient_id)]

    def list_for_current_doctor(self, current_user) -> list[TelemedicineConsultationModel]:
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        if not doctor:
            raise PermissionError("No doctor application found for this account")
        return [self._label(c) for c in self.repo.list_for_doctor(doctor.id)]

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


def finish_encounter_in_medplum(encounter_id: str, medplum: MedplumIntegration) -> None:
    """Background task: mark the consultation's FHIR Encounter finished. Best effort."""
    try:
        medplum.patch_resource("Encounter", encounter_id, [{"op": "replace", "path": "/status", "value": "finished"}])
    except Exception:
        logger.exception("Encounter %s not marked finished in Medplum", encounter_id)


def _email(to: str | None, subject: str, message: str, path: str, button: str) -> None:
    if not to:
        return
    try:
        send_consultation_email(to, subject, message, f"{settings.FRONTEND_URL.rstrip('/')}{path}", button)
    except Exception:
        logger.exception("Consultation email to %s failed", to)


def email_doctors_patient_waiting(consultation_id: str) -> None:
    """Background task: tell every approved doctor a patient is waiting."""
    db = SessionLocal()
    try:
        c = db.get(TelemedicineConsultationModel, consultation_id)
        if c is None or c.status != ConsultationStatus.PENDING:
            return
        patient = TelemedicineService._patient_display_name(c) or "A patient"
        for doctor in DoctorRepository(db).list_by_status(Status.APPROVED):
            _email(
                doctor.user.email,
                "A patient is waiting for you",
                f"{patient} is waiting for a video consultation ({c.reason}). The first doctor to accept takes the call.",
                "/doctor/dashboard",
                "Open the queue",
            )
    except Exception:
        logger.exception("Consultation %s: waiting emails failed", consultation_id)
    finally:
        db.close()


def email_consultation_accepted(consultation_id: str) -> None:
    """Background task: tell the patient their doctor is waiting, and confirm to the doctor."""
    db = SessionLocal()
    try:
        c = db.get(TelemedicineConsultationModel, consultation_id)
        if c is None or c.doctor_profile is None:
            return
        doctor = TelemedicineService._doctor_display_name(c.doctor_profile) or "Your doctor"
        patient = TelemedicineService._patient_display_name(c) or "the patient"
        call = f"/call/telemedicine/{c.id}"
        _email(c.patient.email, f"{doctor} is waiting for you",
               f"{doctor} accepted your consultation and is waiting on the video call. Join now.", call, "Join the call")
        _email(c.doctor_profile.user.email, f"{patient} is waiting on the call",
               f"You accepted the consultation with {patient}. Join the video call now.", call, "Join the call")
    except Exception:
        logger.exception("Consultation %s: accepted emails failed", consultation_id)
    finally:
        db.close()
