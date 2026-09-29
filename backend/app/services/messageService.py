from sqlalchemy.orm import Session

from app.models.enumModel import Status
from app.models.messageModel import MessageModel
from app.repositories.appointmentRepository import AppointmentRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.messageRepository import MessageRepository
from app.repositories.telemedicineRepository import TelemedicineRepository


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
        return self._with_sender_name(message)

    def send_to_consultation(self, consultation_id: str, body: str, current_user) -> MessageModel:
        consultation = self.consultation_repo.get_by_id(consultation_id)
        if not consultation:
            raise ValueError("Consultation not found")
        if not self._can_access(current_user, None, consultation):
            raise PermissionError("Not allowed to message on this consultation")
        message = self.repo.create(current_user.id, body, appointment_id=None, consultation_id=consultation_id)
        return self._with_sender_name(message)

    @staticmethod
    def _with_sender_name(message: MessageModel) -> MessageModel:
        message.sender_name = (
            f"{message.sender.first_name} {message.sender.last_name}".strip() if message.sender else None
        )
        return message

    def _with_sender_names(self, messages: list[MessageModel]) -> list[MessageModel]:
        return [self._with_sender_name(m) for m in messages]
