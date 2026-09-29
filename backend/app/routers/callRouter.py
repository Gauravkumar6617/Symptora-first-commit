from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.enumModel import AppointmentStatus, Status
from app.repositories.appointmentRepository import AppointmentRepository
from app.repositories.doctorRepositories import DoctorRepository
from app.models.userModel import UserModel

router = APIRouter(tags=["Telemedicine"])

# appointment_id -> connected sockets (patient + treating doctor, so at most 2).
# ponytail: in-memory, single-process only — move to Redis pub/sub if this
# ever runs behind more than one worker/instance.
_rooms: dict[str, list[WebSocket]] = {}


def _authorized_user(db: Session, token: str) -> UserModel | None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    try:
        UUID(user_id)
    except (ValueError, TypeError):
        return None
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    return user if user and user.is_active else None


def can_join_call(db: Session, user: UserModel | None, appointment) -> bool:
    """Only the booking patient or the treating (approved) doctor may join —
    and only while the appointment hasn't been cancelled."""
    if not user or not appointment or appointment.status == AppointmentStatus.CANCELLED:
        return False
    if appointment.patient_id == user.id:
        return True
    doctor = DoctorRepository(db).get_by_user_id(user.id)
    return bool(doctor) and doctor.status == Status.APPROVED and doctor.id == appointment.doctor_profile_id


@router.websocket("/ws/call/{appointment_id}")
async def call_signaling(websocket: WebSocket, appointment_id: str, token: str):
    """Relays WebRTC offer/answer/ICE messages between the two participants
    (patient + treating doctor) of one appointment's video call. Does not
    touch the media itself — just signaling."""
    db = SessionLocal()
    try:
        user = _authorized_user(db, token)
        appointment = AppointmentRepository(db).get_by_id(appointment_id)
        if not can_join_call(db, user, appointment):
            await websocket.close(code=4403)
            return
    finally:
        db.close()

    room = _rooms.setdefault(appointment_id, [])
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
            _rooms.pop(appointment_id, None)
