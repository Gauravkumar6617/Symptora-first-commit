"""Instant telemedicine consultations: only patients may start one, the
first approved doctor to accept wins it, and calling the call room requires
an accepted consultation."""

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import *  # noqa: F401,F403 — register every table
from app.models.clinicModel import CliniModel
from app.models.doctorModel import DoctorProfile
from app.models.enumModel import ConsultationStatus, Status
from app.models.userModel import UserModel
from app.routers.callRouter import can_join_consultation_call
from app.schemas.telemedicine import TelemedicineStart
from app.services.telemedicineService import TelemedicineService


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
    admin = UserModel(first_name="Ad", last_name="Min", email="admin@example.com", number="4",
                      hashed_password="x", date_of_birth=date(1990, 1, 1), is_active=True, is_admin=True)
    db.add_all([patient, doc_user, other_doc_user, admin])
    db.flush()

    clinic = CliniModel(name="City Care", picture="x.png", medplum_organisation_id="org-1")
    db.add(clinic)
    db.flush()

    doctor = DoctorProfile(user_id=doc_user.id, specialization="Cardiology", license_number="L-1",
                           status=Status.APPROVED, clinic_id=clinic.id)
    other_doctor = DoctorProfile(user_id=other_doc_user.id, specialization="Cardiology", license_number="L-2",
                                 status=Status.APPROVED, clinic_id=clinic.id)
    db.add_all([doctor, other_doctor])
    db.commit()

    return patient, doc_user, other_doc_user, admin, doctor, other_doctor


def test_a_patient_can_start_a_consultation(db, setup):
    patient, *_ = setup
    consultation = TelemedicineService(db).start(patient, TelemedicineStart(reason="Fever for 2 days"))
    assert consultation.status == ConsultationStatus.PENDING
    assert consultation.doctor_profile_id is None


def test_a_doctor_may_not_start_a_consultation(db, setup):
    _patient, doc_user, *_ = setup
    with pytest.raises(PermissionError):
        TelemedicineService(db).start(doc_user, TelemedicineStart(reason="Fever"))


def test_an_admin_may_not_start_a_consultation(db, setup):
    *_, admin, _doctor, _other = setup
    with pytest.raises(PermissionError):
        TelemedicineService(db).start(admin, TelemedicineStart(reason="Fever"))


def test_only_one_doctor_can_accept_a_pending_consultation(db, setup):
    patient, doc_user, other_doc_user, _admin, _doctor, _other = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))

    accepted = service.accept(doc_user, consultation.id)
    assert accepted.status == ConsultationStatus.IN_PROGRESS
    assert accepted.doctor_profile_id is not None

    with pytest.raises(ValueError):
        service.accept(other_doc_user, consultation.id)


def test_only_patient_or_accepted_doctor_may_join_the_call(db, setup):
    patient, doc_user, other_doc_user, _admin, _doctor, _other = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))

    # nobody may join before a doctor has accepted
    assert can_join_consultation_call(db, patient, consultation) is False

    accepted = service.accept(doc_user, consultation.id)
    assert can_join_consultation_call(db, patient, accepted) is True
    assert can_join_consultation_call(db, doc_user, accepted) is True
    assert can_join_consultation_call(db, other_doc_user, accepted) is False
