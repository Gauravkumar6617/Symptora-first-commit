from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.controllers.telemedicineController import TelemedicineController
from app.core.database import SessionLocal, get_db
from app.deps.auth import get_current_user
from app.deps.medplum import get_medplum_integration
from app.deps.ws_auth import get_ws_user
from app.models.enumModel import Status
from app.models.userModel import UserModel
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.telemedicineRepository import TelemedicineRepository
from app.schemas.telemedicine import TelemedicineRead, TelemedicineStart
from app.services import telemedicineNotifier as notifier
from app.services.telemedicineService import (
    TelemedicineService,
    email_consultation_accepted,
    email_doctors_patient_waiting,
    sync_consultation_to_medplum,
)
from app.utils.integration.medplum.index import MedplumIntegration

router = APIRouter(tags=["Telemedicine"])


def get_service(db: Session = Depends(get_db)) -> TelemedicineService:
    return TelemedicineService(db)


@router.post("/telemedicine", response_model=TelemedicineRead, status_code=status.HTTP_201_CREATED)
async def start_consultation(
    data: TelemedicineStart,
    background: BackgroundTasks,
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
):
    """Patients only. Creates a pending instant consultation and pushes it
    to every doctor currently watching the queue."""
    consultation = TelemedicineController.start(data, current_user, service)
    await notifier.notify_doctors_new_consultation(
        TelemedicineRead.model_validate(consultation).model_dump(mode="json")
    )
    background.add_task(email_doctors_patient_waiting, consultation.id)
    return consultation


@router.get("/telemedicine/pending", response_model=List[TelemedicineRead])
def list_pending_consultations(
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
):
    """Approved doctors only — the current queue, for the initial page load
    (the live queue itself updates over the /ws/telemedicine/doctor socket)."""
    return TelemedicineController.list_pending(current_user, service)


@router.get("/telemedicine/me", response_model=List[TelemedicineRead])
def list_my_consultations(
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
):
    """The caller's own instant consultations, pending through completed."""
    return TelemedicineController.list_mine(current_user, service)


@router.get("/telemedicine/doctor/me", response_model=List[TelemedicineRead])
def list_my_handled_consultations(
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
):
    """Instant consultations the calling doctor has accepted, most recent first."""
    return TelemedicineController.list_for_doctor(current_user, service)


@router.get("/telemedicine/{consultation_id}", response_model=TelemedicineRead)
def get_consultation(
    consultation_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
):
    return TelemedicineController.get(consultation_id, current_user, service)


@router.post("/telemedicine/{consultation_id}/accept", response_model=TelemedicineRead)
async def accept_consultation(
    consultation_id: str,
    background: BackgroundTasks,
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
    medplum: MedplumIntegration = Depends(get_medplum_integration),
):
    """The first approved doctor to call this wins it."""
    consultation = TelemedicineController.accept(consultation_id, current_user, service)
    background.add_task(sync_consultation_to_medplum, consultation.id, medplum)
    background.add_task(email_consultation_accepted, consultation.id)
    await notifier.notify_patient(
        consultation_id,
        {"type": "accepted", "doctor_name": consultation.doctor_name},
    )
    await notifier.notify_doctors_removed(consultation_id)
    return consultation


@router.patch("/telemedicine/{consultation_id}/cancel", response_model=TelemedicineRead)
async def cancel_consultation(
    consultation_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
):
    consultation = TelemedicineController.cancel(consultation_id, current_user, service)
    await notifier.notify_doctors_removed(consultation_id)
    await notifier.notify_patient(consultation_id, {"type": "cancelled"})
    return consultation


@router.patch("/telemedicine/{consultation_id}/complete", response_model=TelemedicineRead)
def complete_consultation(
    consultation_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: TelemedicineService = Depends(get_service),
):
    return TelemedicineController.complete(consultation_id, current_user, service)


@router.websocket("/ws/telemedicine/doctor")
async def doctor_consultation_feed(websocket: WebSocket, token: str):
    """An approved doctor connects here once to receive 'new-consultation'
    pushes for as long as they're online — that connection is what makes
    them "available" for instant consultations."""
    db = SessionLocal()
    try:
        user = get_ws_user(db, token)
        doctor = DoctorRepository(db).get_by_user_id(user.id) if user else None
        if not doctor or doctor.status != Status.APPROVED:
            await websocket.close(code=4403)
            return
    finally:
        db.close()

    await websocket.accept()
    notifier.register_doctor(websocket)
    try:
        while True:
            await websocket.receive_text()  # doctors don't send anything; just detects disconnect
    except WebSocketDisconnect:
        pass
    finally:
        notifier.unregister_doctor(websocket)


@router.websocket("/ws/telemedicine/patient/{consultation_id}")
async def patient_consultation_updates(websocket: WebSocket, consultation_id: str, token: str):
    """The requesting patient connects here after starting a consultation to
    be told the moment a doctor accepts (or the request is cancelled)."""
    db = SessionLocal()
    try:
        user = get_ws_user(db, token)
        consultation = TelemedicineRepository(db).get_by_id(consultation_id)
        if not user or not consultation or consultation.patient_id != user.id:
            await websocket.close(code=4403)
            return
    finally:
        db.close()

    await websocket.accept()
    notifier.register_patient(consultation_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        notifier.unregister_patient(consultation_id, websocket)
