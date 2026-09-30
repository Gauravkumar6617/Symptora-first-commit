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
from app.models.enumModel import ConsultationStatus, ConsultationTrigger, Status
from app.models.symptomCheckModel import SymptomCheckModel
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


def pay(service, patient, consultation):
    """Simulated gateway (no Razorpay keys in tests)."""
    order = service.create_payment(patient, consultation.id)
    service.confirm_payment(patient, consultation.id, order["order_id"], "test_pay_1", None)


def test_unpaid_consultation_stays_out_of_the_queue(db, setup):
    patient, doc_user, *_ = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    assert consultation.amount and consultation.paid_at is None
    assert service.list_pending_for_doctor(doc_user) == []
    with pytest.raises(ValueError):
        service.accept(doc_user, consultation.id)

    pay(service, patient, consultation)
    assert [c.id for c in service.list_pending_for_doctor(doc_user)] == [consultation.id]


def test_payment_rejects_bad_order_or_payment_id(db, setup):
    patient, doc_user, *_ = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    order = service.create_payment(patient, consultation.id)
    with pytest.raises(ValueError):
        service.confirm_payment(patient, consultation.id, "order_other", "test_pay", None)
    with pytest.raises(ValueError):
        service.confirm_payment(patient, consultation.id, order["order_id"], "pay_forged", None)
    with pytest.raises(PermissionError):
        service.create_payment(doc_user, consultation.id)


def test_razorpay_signature_is_checked(db, setup, monkeypatch):
    import hashlib, hmac
    from app.core.config import settings
    from app.services import paymentService

    monkeypatch.setattr(settings, "RAZORPAY_KEY_ID", "rzp_test_x")
    monkeypatch.setattr(settings, "RAZORPAY_KEY_SECRET", "secret")
    patient, *_ = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    consultation.payment_ref = "order_1"
    with pytest.raises(ValueError):
        paymentService.verify(consultation, "order_1", "pay_1", "bad-signature")
    good = hmac.new(b"secret", b"order_1|pay_1", hashlib.sha256).hexdigest()
    paymentService.verify(consultation, "order_1", "pay_1", good)
    assert consultation.paid_at is not None


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
    pay(service, patient, consultation)

    accepted = service.accept(doc_user, consultation.id)
    assert accepted.status == ConsultationStatus.IN_PROGRESS
    assert accepted.doctor_profile_id is not None

    with pytest.raises(ValueError):
        service.accept(other_doc_user, consultation.id)


def test_only_patient_or_accepted_doctor_may_join_the_call(db, setup):
    patient, doc_user, other_doc_user, _admin, _doctor, _other = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    pay(service, patient, consultation)

    # nobody may join before a doctor has accepted
    assert can_join_consultation_call(db, patient, consultation) is False

    accepted = service.accept(doc_user, consultation.id)
    assert can_join_consultation_call(db, patient, accepted) is True
    assert can_join_consultation_call(db, doc_user, accepted) is True
    assert can_join_consultation_call(db, other_doc_user, accepted) is False


def test_patient_and_treating_doctor_history_lists(db, setup):
    patient, doc_user, other_doc_user, _admin, _doctor, _other = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    pay(service, patient, consultation)
    service.accept(doc_user, consultation.id)

    mine = service.list_for_patient(patient.id)
    assert [c.id for c in mine] == [consultation.id]

    handled = service.list_for_current_doctor(doc_user)
    assert [c.id for c in handled] == [consultation.id]

    # a doctor who never handled anything gets an empty list, not an error
    assert service.list_for_current_doctor(other_doc_user) == []


def _make_check(db, patient) -> SymptomCheckModel:
    check = SymptomCheckModel(
        created_by_id=patient.id, subject_name="Pat Ient", symptoms=["high_fever"],
        predictions=[{"disease": "flu", "label": "Flu", "probability": 0.8}],
        urgency="high", urgency_reasons=["High fever with red flags"],
    )
    db.add(check)
    db.commit()
    return check


def test_a_high_risk_check_escalates_to_the_top_of_the_queue(db, setup):
    patient, doc_user, _other_doc_user, _admin, _doctor, _other = setup
    service = TelemedicineService(db)
    check = _make_check(db, patient)

    # an older, manually started request already exists
    manual = service.start(patient, TelemedicineStart(reason="Follow-up question"))
    pay(service, patient, manual)

    escalated = service.escalate(patient, None, "Auto-escalated (High risk): Flu", check.id)
    pay(service, patient, escalated)
    assert escalated.trigger == ConsultationTrigger.AUTO_ESCALATION
    assert escalated.symptom_check_id == check.id
    assert escalated.status == ConsultationStatus.PENDING

    queue = service.list_pending_for_doctor(doc_user)
    assert queue[0].id == escalated.id
    assert queue[1].id == manual.id


def test_a_doctor_cannot_be_escalated(db, setup):
    _patient, doc_user, _other_doc_user, _admin, _doctor, _other = setup
    service = TelemedicineService(db)
    check = _make_check(db, doc_user)

    with pytest.raises(PermissionError):
        service.escalate(doc_user, None, "reason", check.id)


def test_joining_the_call_and_messaging_notify_the_other_side(db, setup):
    from app.routers.callRouter import notify_other_party
    from app.services.messageService import MessageService
    from app.services.notificationService import list_for_user, mark_all_read

    patient, doc_user, *_ = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    pay(service, patient, consultation)
    consultation = service.accept(doc_user, consultation.id)

    notify_other_party(db, doc_user, consultation, "telemedicine")
    notify_other_party(db, doc_user, consultation, "telemedicine")  # reconnect: no duplicate
    joined = [n for n in list_for_user(db, patient.id) if "joined" in n.title]
    assert len(joined) == 1 and joined[0].link == f"/call/telemedicine/{consultation.id}"

    MessageService(db).send_to_consultation(consultation.id, "Is paracetamol ok?", patient)
    [note] = list_for_user(db, doc_user.id)
    assert note.title == "New message from Pat Ient" and "chat=telemedicine:" in note.link

    mark_all_read(db, doc_user.id)
    assert all(n.read for n in list_for_user(db, doc_user.id))


def test_prescription_pdf(db, setup):
    from app.schemas.prescription import PrescriptionCreate
    from app.services.prescriptionService import PrescriptionService, prescription_pdf

    patient, doc_user, *_ = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    pay(service, patient, consultation)
    service.accept(doc_user, consultation.id)
    prescription = PrescriptionService(db).issue(doc_user, PrescriptionCreate(
        consultation_id=consultation.id,
        medications=[{"name": "Paracetamol (500mg)", "dosage": "1 tab", "frequency": "twice daily", "duration": "3 days"}],
    ))
    pdf = prescription_pdf(prescription)
    assert pdf.startswith(b"%PDF-1.4") and pdf.rstrip().endswith(b"%%EOF")
    assert b"Paracetamol \\(500mg\\)" in pdf and b"Dr. Asha Rao" in pdf


def test_call_ends_only_when_both_have_left():
    import asyncio
    from fastapi import WebSocketDisconnect
    from app.routers.callRouter import _run_call

    class FakeSocket:
        def __init__(self):
            self.inbox = asyncio.Queue()
        async def accept(self): pass
        async def close(self, code=None): pass
        async def send_json(self, message): pass
        async def receive_json(self):
            if await self.inbox.get() == "leave":
                raise WebSocketDisconnect()

    async def scenario():
        ended = []
        join = lambda ws: asyncio.create_task(_run_call(ws, "telemedicine:t1", on_ended=lambda: ended.append(1)))
        async def leave(ws, task):
            await ws.inbox.put("leave")
            await task

        doctor, patient = FakeSocket(), FakeSocket()
        d, p = join(doctor), join(patient)
        await asyncio.sleep(0)
        await leave(patient, p)                 # patient's connection drops
        assert ended == []                      # doctor still there: not over
        patient = FakeSocket()
        p = join(patient)                       # patient rejoins
        await asyncio.sleep(0)
        await leave(doctor, d)
        await leave(patient, p)
        assert ended == [1]                     # both gone: completed once

        lonely = FakeSocket()                   # doctor alone, never met the patient
        t = asyncio.create_task(_run_call(lonely, "telemedicine:t2", on_ended=lambda: ended.append(2)))
        await asyncio.sleep(0)
        await leave(lonely, t)
        assert ended == [1]                     # not completed: patient can still join

        # prescription issued mid-call: both sides are told and disconnected
        from app.routers.callRouter import _rooms, force_end_call
        doctor, patient = FakeSocket(), FakeSocket()
        d, p = join(doctor), join(patient)
        await asyncio.sleep(0)
        sent = []
        for ws in (doctor, patient):
            ws.send_json = lambda m, sent=sent: sent.append(m["type"]) or asyncio.sleep(0)
        await force_end_call("telemedicine:t1")
        assert sent.count("call-ended") == 2 and "telemedicine:t1" not in _rooms
        await leave(doctor, d)
        await leave(patient, p)

    asyncio.run(scenario())


def test_admin_earnings_count_only_paid(db, setup):
    from app.repositories.telemedicineRepository import TelemedicineRepository

    patient, *_ = setup
    service = TelemedicineService(db)
    for _ in range(2):
        pay(service, patient, service.start(patient, TelemedicineStart(reason="Fever")))
    service.start(patient, TelemedicineStart(reason="Unpaid"))
    earnings = TelemedicineRepository(db).earnings()
    fee = TelemedicineService(db).repo.list_for_patient(patient.id)[0].amount
    assert earnings == {"total_earnings": 2 * fee, "month_earnings": 2 * fee, "paid_consultations": 2}


def test_issuing_a_prescription_completes_the_consultation(db, setup):
    from app.schemas.prescription import PrescriptionCreate
    from app.services.prescriptionService import PrescriptionService

    patient, doc_user, *_ = setup
    service = TelemedicineService(db)
    consultation = service.start(patient, TelemedicineStart(reason="Fever"))
    pay(service, patient, consultation)
    service.accept(doc_user, consultation.id)
    PrescriptionService(db).issue(doc_user, PrescriptionCreate(
        consultation_id=consultation.id,
        medications=[{"name": "ORS", "dosage": "1 sachet", "frequency": "after each loose stool", "duration": "2 days"}],
    ))
    db.refresh(consultation)
    assert consultation.status == ConsultationStatus.COMPLETED
