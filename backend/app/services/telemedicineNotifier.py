from fastapi import WebSocket

# ponytail: in-memory registries, single-process only — same ceiling as
# app.routers.callRouter's room dict; move to Redis pub/sub if this ever
# runs behind more than one worker/instance.
_doctor_sockets: list[WebSocket] = []
_patient_sockets: dict[str, WebSocket] = {}


def register_doctor(ws: WebSocket) -> None:
    _doctor_sockets.append(ws)


def unregister_doctor(ws: WebSocket) -> None:
    if ws in _doctor_sockets:
        _doctor_sockets.remove(ws)


def register_patient(consultation_id: str, ws: WebSocket) -> None:
    _patient_sockets[consultation_id] = ws


def unregister_patient(consultation_id: str) -> None:
    _patient_sockets.pop(consultation_id, None)


async def notify_doctors_new_consultation(payload: dict) -> None:
    for ws in list(_doctor_sockets):
        try:
            await ws.send_json({"type": "new-consultation", "consultation": payload})
        except Exception:
            pass


async def notify_doctors_removed(consultation_id: str) -> None:
    """Tell every listening doctor a consultation is no longer up for grabs
    (claimed by someone else, or cancelled while still pending)."""
    for ws in list(_doctor_sockets):
        try:
            await ws.send_json({"type": "removed", "id": consultation_id})
        except Exception:
            pass


async def notify_patient(consultation_id: str, message: dict) -> None:
    ws = _patient_sockets.get(consultation_id)
    if ws:
        try:
            await ws.send_json(message)
        except Exception:
            pass
