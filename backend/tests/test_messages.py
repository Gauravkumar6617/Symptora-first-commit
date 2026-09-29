"""Chat on an appointment or instant consultation: only the patient and the
treating doctor may read or send."""

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
from app.services.messageService import MessageService


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


def test_patient_and_doctor_can_message_each_other(db, setup):
    patient, doc_user, _stranger, appointment = setup
    service = MessageService(db)

    service.send_to_appointment(appointment.id, "Hi doctor", patient)
    service.send_to_appointment(appointment.id, "Hello, how can I help?", doc_user)

    thread = service.list_for_appointment(appointment.id, patient)
    assert [m.body for m in thread] == ["Hi doctor", "Hello, how can I help?"]
    assert thread[1].sender_name == "Asha Rao"


def test_an_unrelated_user_may_not_read_or_send(db, setup):
    _patient, _doc_user, stranger, appointment = setup
    service = MessageService(db)

    with pytest.raises(PermissionError):
        service.list_for_appointment(appointment.id, stranger)
    with pytest.raises(PermissionError):
        service.send_to_appointment(appointment.id, "hi", stranger)
