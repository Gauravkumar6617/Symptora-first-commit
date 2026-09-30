from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.deps.ws_auth import get_ws_user
from app.models.enumModel import AppointmentStatus, ConsultationStatus, Status
from app.repositories.appointmentRepository import AppointmentRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.repositories.telemedicineRepository import TelemedicineRepository
from app.services.notificationService import notify

router = APIRouter(tags=["Telemedicine"])

# room key -> connected sockets (at most 2: the patient + the treating doctor).
# ponytail: in-memory, single-process only — move to Redis pub/sub if this
# ever runs behind more than one worker/instance.
_rooms: dict[str, list[WebSocket]] = {}


def can_join_appointment_call(db: Session, user, appointment) -> bool:
    """Only the booking patient or the treating (approved) doctor may join —
    and only while the appointment hasn't been cancelled."""
    if not user or not appointment or appointment.status == AppointmentStatus.CANCELLED:
        return False
    if appointment.patient_id == user.id:
        return True
    doctor = DoctorRepository(db).get_by_user_id(user.id)
    return bool(doctor) and doctor.status == Status.APPROVED and doctor.id == appointment.doctor_profile_id


# Kept for backwards compatibility with existing imports/tests.
can_join_call = can_join_appointment_call


def can_join_consultation_call(db: Session, user, consultation) -> bool:
    """Only the requesting patient or the doctor who accepted may join — and
    only once a doctor has actually accepted (status IN_PROGRESS)."""
    if not user or not consultation or consultation.status != ConsultationStatus.IN_PROGRESS:
        return False
    if consultation.patient_id == user.id:
        return True
    doctor = DoctorRepository(db).get_by_user_id(user.id)
    return bool(doctor) and doctor.id == consultation.doctor_profile_id


def notify_other_party(db: Session, user, visit, kind: str) -> None:
    """Someone opened the call and is alone in it: tell the other side
    (bell notification) that they're waiting, with a link straight in."""
    if _rooms.get(f"{kind}:{visit.id}"):
        return  # the other side is already in the call
    doctor_user_id = visit.doctor_profile.user_id if visit.doctor_profile else None
    if user.id == visit.patient_id:
        other_id, name = doctor_user_id, f"{user.first_name} {user.last_name}".strip()
    else:
        other_id, name = visit.patient_id, f"Dr. {user.first_name} {user.last_name}"
    notify(db, other_id, f"{name} joined the video call", "They're waiting for you. Join now.",
           f"/call/{kind}/{visit.id}")


async def _run_call(websocket: WebSocket, room_key: str) -> None:
    """Relays WebRTC offer/answer/ICE messages between the two participants
    of one room. Does not touch the media itself — just signaling."""
    room = _rooms.setdefault(room_key, [])
    if len(room) >= 2:
        await websocket.close(code=4409)  # call already has both participants
        return

    await websocket.accept()
    room.append(websocket)
    if len(room) == 2:
        # Tell the peer who was already waiting that it can start the offer.
        await room[0].send_json({"type": "peer-joined"})

    try:
        while True:
            message = await websocket.receive_json()
            for peer in room:
                if peer is not websocket:
                    await peer.send_json(message)
    except WebSocketDisconnect:
        pass
    finally:
        room.remove(websocket)
        for peer in room:
            await peer.send_json({"type": "peer-left"})
        if not room:
            _rooms.pop(room_key, None)


@router.websocket("/ws/call/{appointment_id}")
async def appointment_call_signaling(websocket: WebSocket, appointment_id: str, token: str):
    db = SessionLocal()
    try:
        user = get_ws_user(db, token)
        appointment = AppointmentRepository(db).get_by_id(appointment_id)
        if not can_join_appointment_call(db, user, appointment):
            await websocket.close(code=4403)
            return
        notify_other_party(db, user, appointment, "appointment")
    finally:
        db.close()

    await _run_call(websocket, f"appointment:{appointment_id}")


@router.websocket("/ws/call/telemedicine/{consultation_id}")
async def telemedicine_call_signaling(websocket: WebSocket, consultation_id: str, token: str):
    db = SessionLocal()
    try:
        user = get_ws_user(db, token)
        consultation = TelemedicineRepository(db).get_by_id(consultation_id)
        if not can_join_consultation_call(db, user, consultation):
            await websocket.close(code=4403)
            return
        notify_other_party(db, user, consultation, "telemedicine")
    finally:
        db.close()

    await _run_call(websocket, f"telemedicine:{consultation_id}")
