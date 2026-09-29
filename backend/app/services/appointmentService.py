import logging
from datetime import datetime, timedelta, date

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.appointmentModel import AppointmentModel
from app.models.enumModel import AppointmentStatus, DayOfWeek, Status
from app.repositories.appointmentRepository import AppointmentRepository
from app.repositories.clinicRepositories import ClinicRepository
from app.repositories.doctorClinicRepository import DoctorClinicRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.familyMemberRepository import FamilyMemberRepository
from app.repositories.serviceRepository import ServiceRepository
from app.schemas.appointment import AppointmentCreate, AppointmentCreateByService
from app.services.familyMemberService import FamilyMemberService
from app.utils.integration.google_calendar.index import GoogleCalenderIntegration
from app.utils.integration.medplum.index import MedplumIntegration
from app.utils.otp.send_otp import send_appointment_confirmation_email

logger = logging.getLogger(__name__)

# date.weekday(): Monday=0 ... Sunday=6
_WEEKDAY_TO_DAY = {
    0: DayOfWeek.MONDAY,
    1: DayOfWeek.TUESDAY,
    2: DayOfWeek.WEDNESDAY,
    3: DayOfWeek.THURSDAY,
    4: DayOfWeek.FRIDAY,
    5: DayOfWeek.SATURDAY,
    6: DayOfWeek.SUNDAY,
}

# AM slot -> 9:00-9:30 local, PM slot -> 15:00-15:30 local; enough to put a
# real time on the calendar invite without adding exact-time booking.
_SLOT_HOUR = {"am": 9, "pm": 15}


class AppointmentService:

    def __init__(self, db: Session):
        self.db = db
        self.repo = AppointmentRepository(db)
        self.doctor_repo = DoctorRepository(db)
        self.clinic_repo = ClinicRepository(db)
        self.doctor_clinic_repo = DoctorClinicRepository(db)
        self.family_repo = FamilyMemberRepository(db)
        self.service_repo = ServiceRepository(db)

    def book(self, patient, data: AppointmentCreate, fallback_fee: float | None = None) -> AppointmentModel:
        doctor = self.doctor_repo.get_by_id(data.doctor_profile_id)
        if not doctor or doctor.status != Status.APPROVED:
            raise ValueError("Doctor not found")

        clinic = self.clinic_repo.get_by_id(data.clinic_id)
        if not clinic:
            raise ValueError("Clinic not found")

        if not self.doctor_clinic_repo.get_by_doctor_and_clinic(doctor.id, clinic.id):
            raise ValueError("This doctor does not practice at this clinic")

        if data.appointment_date < date.today():
            raise ValueError("Appointment date cannot be in the past")

        if data.family_member_id and not self.family_repo.get_for_owner(patient.id, data.family_member_id):
            raise ValueError("Family member not found")

        weekday = _WEEKDAY_TO_DAY[data.appointment_date.weekday()]
        available = any(
            slot.days == weekday and slot.slot == data.slot
            for slot in doctor.effective_availability_slots
        )
        if not available:
            raise ValueError("Doctor is not available at that day/slot")

        if self.repo.find_conflict(doctor.id, data.appointment_date, data.slot):
            raise ValueError("That slot is already booked")

        if doctor.max_appointments_per_day is not None:
            booked_today = self.repo.count_for_doctor_on_date(doctor.id, data.appointment_date)
            if booked_today >= doctor.max_appointments_per_day:
                raise ValueError("This doctor's appointment quota for that day is full")

        fee = float(doctor.fee) if doctor.fee is not None else fallback_fee
        appointment = self.repo.create(patient.id, data, fee=fee)

        # Calendar invite + Meet link and the confirmation email are both
        # nice-to-haves on top of a valid booking — never let either block
        # or fail the appointment itself.
        try:
            self._create_calendar_event(appointment, doctor)
        except Exception:
            pass

        try:
            send_appointment_confirmation_email(
                to_email=appointment.patient_email,
                patient_name=appointment.patient_name,
                doctor_name=self._doctor_display_name(doctor) or doctor.specialization,
                clinic_name=clinic.name,
                when=f"{appointment.appointment_date.strftime('%A, %d %B %Y')} · {appointment.slot.value.upper()}",
                meet_link=appointment.meet_link,
            )
        except Exception:
            pass

        return appointment

    def book_by_service(self, patient, data: AppointmentCreateByService) -> AppointmentModel:
        """Book a clinic for a service without picking a doctor — tries every
        approved doctor at that clinic whose specialization matches the
        service, in turn, and books the first one free at that day/slot."""
        clinic = self.clinic_repo.get_by_id(data.clinic_id)
        if not clinic:
            raise ValueError("Clinic not found")

        service = self.service_repo.get_by_id(data.service_id)
        if not service:
            raise ValueError("Service not found")

        candidates = [
            link.doctor_profile
            for link in clinic.doctor_links
            if link.doctor_profile
            and link.doctor_profile.status == Status.APPROVED
            and link.doctor_profile.specialization == service.specialization
        ]
        if not candidates:
            raise ValueError("No doctor at this clinic offers that service")

        service_fee = float(service.fee) if service.fee is not None else None

        last_error: ValueError | None = None
        for doctor in candidates:
            try:
                return self.book(
                    patient,
                    AppointmentCreate(
                        doctor_profile_id=doctor.id,
                        clinic_id=clinic.id,
                        family_member_id=data.family_member_id,
                        patient_name=data.patient_name,
                        patient_email=data.patient_email,
                        patient_phone=data.patient_phone,
                        reason=data.reason,
                        notes=data.notes,
                        appointment_date=data.appointment_date,
                        slot=data.slot,
                    ),
                    fallback_fee=service_fee,
                )
            except ValueError as e:
                last_error = e
        raise last_error or ValueError("No doctor available for that day/slot")

    def _create_calendar_event(self, appointment: AppointmentModel, doctor) -> None:
        calendar = GoogleCalenderIntegration(
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            refresh_token=settings.GOOGLE_REFRESH_TOKEN,
        )
        start_hour = _SLOT_HOUR[appointment.slot.value]
        start = datetime.combine(appointment.appointment_date, datetime.min.time()).replace(hour=start_hour)
        end = start + timedelta(minutes=30)

        event = calendar.create_event({
            "summary": f"Symptora appointment — {appointment.patient_name}",
            "description": appointment.reason,
            "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
            "attendees": [{"email": appointment.patient_email}],
            "conferenceData": {
                "createRequest": {
                    "requestId": appointment.id,
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        })

        appointment.google_event_id = event.get("id")
        appointment.meet_link = event.get("hangoutLink")
        self.repo.save(appointment)

    def list_for_patient(self, patient_id: str) -> list[AppointmentModel]:
        return self._with_labels(self.repo.list_for_patient(patient_id))

    def list_for_current_doctor(self, current_user) -> list[AppointmentModel]:
        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        if not doctor:
            raise ValueError("No doctor application found for this account")
        return self._with_labels(self.repo.list_for_doctor(doctor.id))

    def cancel(self, appointment_id: str, current_user) -> AppointmentModel:
        appointment = self.repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found")

        doctor = self.doctor_repo.get_by_user_id(current_user.id)
        is_owner = appointment.patient_id == current_user.id
        is_treating_doctor = doctor is not None and doctor.id == appointment.doctor_profile_id
        if not (is_owner or is_treating_doctor or current_user.is_admin):
            raise PermissionError("Not allowed to cancel this appointment")

        if appointment.status == AppointmentStatus.CANCELLED:
            raise ValueError("Appointment is already cancelled")

        appointment.status = AppointmentStatus.CANCELLED
        return self.repo.save(appointment)

    def _with_labels(self, appointments: list[AppointmentModel]) -> list[AppointmentModel]:
        """Attach doctor/clinic display names for the list view (not persisted)."""
        for a in appointments:
            a.doctor_name = self._doctor_display_name(a.doctor_profile)
            a.doctor_specialization = a.doctor_profile.specialization if a.doctor_profile else None
            a.clinic_name = a.clinic.name if a.clinic else None
        return appointments

    @staticmethod
    def _doctor_display_name(doctor) -> str | None:
        if not doctor or not doctor.user:
            return None
        return f"Dr. {doctor.user.first_name} {doctor.user.last_name}"


def appointment_fhir(appointment: AppointmentModel, patient_id: str, practitioner_id: str) -> dict:
    """The booking as a FHIR Appointment."""
    start_hour = _SLOT_HOUR[appointment.slot.value]
    start = datetime.combine(appointment.appointment_date, datetime.min.time()).replace(hour=start_hour)
    end = start + timedelta(minutes=30)
    return {
        "resourceType": "Appointment",
        "status": "booked",
        "start": start.isoformat(),
        "end": end.isoformat(),
        "reasonCode": [{"text": appointment.reason}],
        "participant": [
            {"actor": {"reference": f"Patient/{patient_id}"}, "status": "accepted"},
            {"actor": {"reference": f"Practitioner/{practitioner_id}"}, "status": "accepted"},
        ],
    }


def sync_appointment_to_medplum(appointment_id: str, medplum: MedplumIntegration) -> None:
    """Background task: record the booking as a FHIR Appointment.

    Best effort — Medplum being down never blocks or unwinds the booking
    itself, same as the calendar invite and confirmation email above."""
    db = SessionLocal()
    try:
        appointment = db.get(AppointmentModel, appointment_id)
        if appointment is None or appointment.doctor_profile is None:
            return
        practitioner_id = appointment.doctor_profile.medplum_practitioner_id
        if not practitioner_id:
            logger.warning("Appointment %s not sent to Medplum: doctor has no Medplum id", appointment_id)
            return

        if appointment.family_member is not None:
            patient_id = FamilyMemberService(db, medplum).ensure_medplum_patient(
                appointment.family_member, appointment.patient
            )
        else:
            patient_id = appointment.patient.medplum_patient_id
        if not patient_id:
            logger.warning("Appointment %s not sent to Medplum: patient has no Medplum id", appointment_id)
            return

        created = medplum.create_resource(appointment_fhir(appointment, patient_id, practitioner_id))
        appointment.medplum_appointment_id = created.get("id")
        db.commit()
    except Exception:
        logger.exception("Appointment %s not sent to Medplum", appointment_id)
    finally:
        db.close()
