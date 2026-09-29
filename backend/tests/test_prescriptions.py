"""E-prescriptions: only the treating (approved) doctor may issue one, for
either an appointment or an instant consultation, and it lands in the
patient's list."""

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
from app.schemas.prescription import MedicationItem, PrescriptionCreate
from app.services.prescriptionService import PrescriptionService


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
    other_doc_user = UserModel(first_name="Ravi", last_name="Iyer", email="ravi@example.com", number="3",
                               hashed_password="x", date_of_birth=date(1985, 1, 1), is_active=True)
    db.add_all([patient, doc_user, other_doc_user])
    db.flush()

    clinic = CliniModel(name="City Care", picture="x.png", medplum_organisation_id="org-1")
    db.add(clinic)
    db.flush()

    doctor = DoctorProfile(user_id=doc_user.id, specialization="Cardiology", license_number="L-1",
                           status=Status.APPROVED, clinic_id=clinic.id)
    other_doctor = DoctorProfile(user_id=other_doc_user.id, specialization="Cardiology", license_number="L-2",
                                 status=Status.APPROVED, clinic_id=clinic.id)
    db.add_all([doctor, other_doctor])
    db.flush()

    appointment = AppointmentModel(
        patient_id=patient.id, doctor_profile_id=doctor.id, clinic_id=clinic.id,
        patient_name="Pat Ient", patient_email="pat@example.com", patient_phone="1",
        reason="Checkup", appointment_date=date.today(), slot=TimeSlot.AM,
        status=AppointmentStatus.COMPLETED,
    )
    db.add(appointment)
    db.commit()

    return patient, doc_user, other_doc_user, appointment


def _payload(appointment_id):
    return PrescriptionCreate(
        appointment_id=appointment_id,
        medications=[MedicationItem(name="Paracetamol", dosage="500mg", frequency="Twice daily", duration="5 days")],
    )


def test_treating_doctor_can_issue_a_prescription(db, setup):
    patient, doc_user, _other_doc_user, appointment = setup
    service = PrescriptionService(db)

    prescription = service.issue(doc_user, _payload(appointment.id))
    assert prescription.patient_id == patient.id
    assert prescription.medications[0]["name"] == "Paracetamol"

    mine = service.list_for_patient(patient.id)
    assert [p.id for p in mine] == [prescription.id]


def test_a_different_doctor_may_not_prescribe_for_this_visit(db, setup):
    _patient, _doc_user, other_doc_user, appointment = setup
    service = PrescriptionService(db)

    with pytest.raises(PermissionError):
        service.issue(other_doc_user, _payload(appointment.id))


def test_exactly_one_of_appointment_or_consultation_is_required(db, setup):
    _patient, doc_user, _other_doc_user, _appointment = setup
    service = PrescriptionService(db)

    with pytest.raises(ValueError):
        service.issue(doc_user, PrescriptionCreate(
            medications=[MedicationItem(name="X", dosage="1", frequency="1", duration="1")],
        ))
