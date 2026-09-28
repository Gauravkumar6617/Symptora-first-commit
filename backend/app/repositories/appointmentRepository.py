from datetime import date

from sqlalchemy.orm import Session

from app.models.appointmentModel import AppointmentModel
from app.models.enumModel import AppointmentStatus, TimeSlot
from app.schemas.appointment import AppointmentCreate


class AppointmentRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, patient_id: str, data: AppointmentCreate, fee: float | None = None) -> AppointmentModel:
        appointment = AppointmentModel(
            patient_id=patient_id,
            family_member_id=data.family_member_id,
            doctor_profile_id=data.doctor_profile_id,
            clinic_id=data.clinic_id,
            patient_name=data.patient_name,
            patient_email=data.patient_email,
            patient_phone=data.patient_phone,
            reason=data.reason,
            notes=data.notes,
            appointment_date=data.appointment_date,
            slot=data.slot,
            fee=fee,
        )
        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def get_by_id(self, appointment_id: str) -> AppointmentModel | None:
        return (
            self.db.query(AppointmentModel)
            .filter(AppointmentModel.id == appointment_id)
            .first()
        )

    def list_for_patient(self, patient_id: str) -> list[AppointmentModel]:
        return (
            self.db.query(AppointmentModel)
            .filter(AppointmentModel.patient_id == patient_id)
            .order_by(AppointmentModel.appointment_date.desc())
            .all()
        )

    def list_for_doctor(self, doctor_profile_id: str) -> list[AppointmentModel]:
        return (
            self.db.query(AppointmentModel)
            .filter(AppointmentModel.doctor_profile_id == doctor_profile_id)
            .order_by(AppointmentModel.appointment_date.desc())
            .all()
        )

    def find_conflict(
        self, doctor_profile_id: str, appointment_date: date, slot: TimeSlot
    ) -> AppointmentModel | None:
        """An already-booked (not cancelled) slot for this doctor — the
        one thing that blocks a new booking on that date/slot."""
        return (
            self.db.query(AppointmentModel)
            .filter(
                AppointmentModel.doctor_profile_id == doctor_profile_id,
                AppointmentModel.appointment_date == appointment_date,
                AppointmentModel.slot == slot,
                AppointmentModel.status.notin_(
                    [AppointmentStatus.CANCELLED]
                ),
            )
            .first()
        )

    def count_for_doctor_on_date(self, doctor_profile_id: str, appointment_date: date) -> int:
        """Non-cancelled bookings this doctor already has that day — checked
        against their optional daily quota."""
        return (
            self.db.query(AppointmentModel)
            .filter(
                AppointmentModel.doctor_profile_id == doctor_profile_id,
                AppointmentModel.appointment_date == appointment_date,
                AppointmentModel.status.notin_([AppointmentStatus.CANCELLED]),
            )
            .count()
        )

    def save(self, appointment: AppointmentModel) -> AppointmentModel:
        self.db.commit()
        self.db.refresh(appointment)
        return appointment
