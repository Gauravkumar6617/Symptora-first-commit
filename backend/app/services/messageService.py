import logging

from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.models.enumModel import Status
from app.models.messageModel import MessageModel
from app.repositories.appointmentRepository import AppointmentRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.messageRepository import MessageRepository
from app.repositories.telemedicineRepository import TelemedicineRepository
from app.services.familyMemberService import FamilyMemberService
from app.services.notificationService import notify
from app.utils.integration.medplum.index import MedplumIntegration

logger = logging.getLogger(__name__)


class MessageService:
    """Chat thread on one appointment or instant consultation — the same
    two participants (patient + treating doctor) who may join its call."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = MessageRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.consultation_repo = TelemedicineRepository(db)
        self.doctor_repo = DoctorRepository(db)

    def _can_access(self, current_user, appointment, consultation) -> bool:
        thread = appointment or consultation
        if not thread:
            return False
        if thread.patient_id == current_user.id:
            return True
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        return bool(doctor) and doctor.status == Status.APPROVED and doctor.id == thread.doctor_profile_id

    def list_for_appointment(self, appointment_id: str, current_user) -> list[MessageModel]:
        appointment = self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
        if not self._can_access(current_user, appointment, None):
            raise PermissionError("Not allowed to view these messages")
        return self._with_sender_names(self.repo.list_for_appointment(appointment_id))

    def list_for_consultation(self, consultation_id: str, current_user) -> list[MessageModel]:
        consultation = self.consultation_repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        if not self._can_access(current_user, None, consultation):
            raise PermissionError("Not allowed to view these messages")
        return self._with_sender_names(self.repo.list_for_consultation(consultation_id))

    def send_to_appointment(self, appointment_id: str, body: str, current_user) -> MessageModel:
        appointment = self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")
        if not self._can_access(current_user, appointment, None):
            raise PermissionError("Not allowed to message on this appointment")
        message = self.repo.create(current_user.id, body, appointment_id=appointment_id, consultation_id=None)
        self._notify_recipient(current_user, appointment, "appointment", body)
        return self._with_sender_name(message)

    def send_to_consultation(self, consultation_id: str, body: str, current_user) -> MessageModel:
        consultation = self.consultation_repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        if not self._can_access(current_user, None, consultation):
            raise PermissionError("Not allowed to message on this consultation")
        message = self.repo.create(current_user.id, body, appointment_id=None, consultation_id=consultation_id)
        self._notify_recipient(current_user, consultation, "telemedicine", body)
        return self._with_sender_name(message)

    def _notify_recipient(self, sender, thread, kind: str, body: str) -> None:
        """Bell notification for the other participant, linking to the open thread."""
        chat = f"?chat={kind}:{thread.id}"
        if sender.id == thread.patient_id:
            recipient = thread.doctor_profile.user_id if thread.doctor_profile else None
            title, link = f"New message from {sender.first_name} {sender.last_name}".strip(), f"/doctor/dashboard{chat}"
        else:
            recipient = thread.patient_id
            title, link = f"New message from Dr. {sender.first_name} {sender.last_name}", f"/dashboard{chat}"
        notify(self.db, recipient, title, body[:140], link)

    @staticmethod
    def _with_sender_name(message: MessageModel) -> MessageModel:
        message.sender_name = (
            f"{message.sender.first_name} {message.sender.last_name}".strip() if message.sender else None
        )
        return message

    def _with_sender_names(self, messages: list[MessageModel]) -> list[MessageModel]:
        return [self._with_sender_name(m) for m in messages]


def sync_message_to_medplum(message_id: str, medplum: MedplumIntegration) -> None:
    """Background task: record the chat message as a FHIR Communication between
    the patient and practitioner. Best effort, like every other Medplum sync."""
    db = SessionLocal()
    try:
        message = db.get(MessageModel, message_id)
        thread = message and (message.appointment or message.consultation)
        if thread is None or thread.doctor_profile is None:
            return
        practitioner = thread.doctor_profile.medplum_practitioner_id
        if thread.family_member is not None:
            patient = FamilyMemberService(db, medplum).ensure_medplum_patient(thread.family_member, thread.patient)
        else:
            patient = thread.patient.medplum_patient_id
        if not (practitioner and patient):
            logger.warning("Message %s not sent to Medplum: missing patient or practitioner id", message_id)
            return
        patient_ref, doctor_ref = f"Patient/{patient}", f"Practitioner/{practitioner}"
        from_patient = message.sender_id == thread.patient_id
        resource = {
            "resourceType": "Communication",
            "status": "completed",
            "subject": {"reference": patient_ref},
            "sender": {"reference": patient_ref if from_patient else doctor_ref},
            "recipient": [{"reference": doctor_ref if from_patient else patient_ref}],
            "sent": message.created_at.isoformat(),
            "payload": [{"contentString": message.body}],
        }
        encounter = getattr(thread, "medplum_encounter_id", None)
        if encounter:
            resource["encounter"] = {"reference": f"Encounter/{encounter}"}
        medplum.create_resource(resource)
    except Exception:
        logger.exception("Message %s not sent to Medplum", message_id)
    finally:
        db.close()
