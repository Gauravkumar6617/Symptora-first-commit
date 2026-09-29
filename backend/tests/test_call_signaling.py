"""Who may join an appointment's video call: the booking patient or the
treating approved doctor, and nobody once it's cancelled."""

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import *  # noqa: F401,F403 — register every table
from app.models.appointmentModel import AppointmentModel
from app.models.clinicModel import CliniModel
from app.models.doctorModel import DoctorProfile
from app.models.enumModel import AppointmentStatus, Status, TimeSlot
from app.models.userModel import UserModel
from app.routers.callRouter import can_join_call


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


@pytest.fixture
def setup(db):
    patient = UserModel(first_name="Pat", last_name="Ient", email="pat@example.com", number="1",
                        hashed_password="x", date_of_birth=date(1990, 1, 1), is_active=True)
    doc_user = UserModel(first_name="Asha", last_name="Rao", email="asha@example.com", number="2",
                         hashed_password="x", date_of_birth=date(1985, 1, 1), is_active=True)
    stranger = UserModel(first_name="No", last_name="One", email="no@example.com", number="3",
                         hashed_password="x", date_of_birth=date(1990, 1, 1), is_active=True)
    db.add_all([patient, doc_user, stranger])
    db.flush()

    clinic = CliniModel(name="City Care", picture="x.png", medplum_organisation_id="org-1")
    db.add(clinic)
    db.flush()

    doctor = DoctorProfile(user_id=doc_user.id, specialization="Cardiology", license_number="L-1",
                           status=Status.APPROVED, clinic_id=clinic.id)
    db.add(doctor)
    db.flush()

    appointment = AppointmentModel(
        patient_id=patient.id, doctor_profile_id=doctor.id, clinic_id=clinic.id,
        patient_name="Pat Ient", patient_email="pat@example.com", patient_phone="1",
        reason="Checkup", appointment_date=date.today(), slot=TimeSlot.AM,
        status=AppointmentStatus.SCHEDULED,
    )
    db.add(appointment)
    db.commit()

    return patient, doc_user, stranger, appointment


def test_patient_and_treating_doctor_may_join(db, setup):
    patient, doc_user, _stranger, appointment = setup
    assert can_join_call(db, patient, appointment) is True
    assert can_join_call(db, doc_user, appointment) is True


def test_an_unrelated_user_may_not_join(db, setup):
    _patient, _doc_user, stranger, appointment = setup
    assert can_join_call(db, stranger, appointment) is False


def test_nobody_may_join_a_cancelled_appointment(db, setup):
    patient, _doc_user, _stranger, appointment = setup
    appointment.status = AppointmentStatus.CANCELLED
    assert can_join_call(db, patient, appointment) is False


def test_no_user_or_no_appointment_is_rejected(db, setup):
    patient, _doc_user, _stranger, appointment = setup
    assert can_join_call(db, None, appointment) is False
    assert can_join_call(db, patient, None) is False
