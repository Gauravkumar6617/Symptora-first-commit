"""Appointment booking: availability/conflict rules, and that a calendar
failure never blocks the booking itself, on SQLite with Google Calendar faked."""

import sys
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import *  # noqa: F401,F403 — register every table
from app.models.clinicModel import CliniModel
from app.models.doctorAvailabilityModel import doctorAvailabilityModel
from app.models.doctorClinicModel import DoctorClinicModel
from app.models.doctorModel import DoctorProfile
from app.models.enumModel import DayOfWeek, Status, TimeSlot
from app.models.userModel import UserModel
from app.schemas.appointment import AppointmentCreate
from app.services.appointmentService import AppointmentService


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def _next_weekday(target: DayOfWeek) -> date:
    order = list(DayOfWeek)
    target_idx = order.index(target)
    today = date.today()
    offset = (target_idx - today.weekday()) % 7 or 7
    return today + timedelta(days=offset)


@pytest.fixture
def setup(db):
    patient = UserModel(first_name="Pat", last_name="Ient", email="pat@example.com", number="1",
                        hashed_password="x", date_of_birth=date(1990, 1, 1), is_active=True)
    doc_user = UserModel(first_name="Asha", last_name="Rao", email="asha@example.com", number="2",
                         hashed_password="x", date_of_birth=date(1985, 1, 1), is_active=True)
    db.add_all([patient, doc_user])
    db.flush()

    clinic = CliniModel(name="City Care", picture="x.png", medplum_organisation_id="org-1")
    db.add(clinic)
    db.flush()

    doctor = DoctorProfile(user_id=doc_user.id, specialization="Cardiology", license_number="L-1",
                           status=Status.APPROVED, clinic_id=clinic.id)
    db.add(doctor)
    db.flush()

    db.add(DoctorClinicModel(doctor_profile_id=doctor.id, clinic_id=clinic.id))
    db.add(doctorAvailabilityModel(doctor_profile_id=doctor.id, days=DayOfWeek.MONDAY, slot=TimeSlot.AM))
    db.commit()

    return patient, doctor, clinic


def booking_data(doctor, clinic, appointment_date, slot=TimeSlot.AM):
    return AppointmentCreate(
        doctor_profile_id=doctor.id,
        clinic_id=clinic.id,
        patient_name="Pat Ient",
        patient_email="pat@example.com",
        patient_phone="9999999999",
        reason="Checkup",
        appointment_date=appointment_date,
        slot=slot,
    )


def test_book_succeeds_on_an_available_day_and_slot(db, setup):
    patient, doctor, clinic = setup
    monday = _next_weekday(DayOfWeek.MONDAY)
    with patch("app.services.appointmentService.AppointmentService._create_calendar_event"):
        appointment = AppointmentService(db).book(patient, booking_data(doctor, clinic, monday))
    assert appointment.status.value == "scheduled"


def test_book_rejects_a_day_the_doctor_has_no_availability_for(db, setup):
    patient, doctor, clinic = setup
    tuesday = _next_weekday(DayOfWeek.TUESDAY)
    with pytest.raises(ValueError):
        AppointmentService(db).book(patient, booking_data(doctor, clinic, tuesday))


def test_book_rejects_a_slot_already_taken(db, setup):
    patient, doctor, clinic = setup
    monday = _next_weekday(DayOfWeek.MONDAY)
    with patch("app.services.appointmentService.AppointmentService._create_calendar_event"):
        AppointmentService(db).book(patient, booking_data(doctor, clinic, monday))
        with pytest.raises(ValueError):
            AppointmentService(db).book(patient, booking_data(doctor, clinic, monday))


def test_calendar_failure_does_not_block_the_booking(db, setup):
    patient, doctor, clinic = setup
    monday = _next_weekday(DayOfWeek.MONDAY)
    with patch(
        "app.services.appointmentService.AppointmentService._create_calendar_event",
        side_effect=RuntimeError("Google is down"),
    ):
        appointment = AppointmentService(db).book(patient, booking_data(doctor, clinic, monday))
    assert appointment.id is not None
    assert appointment.meet_link is None
