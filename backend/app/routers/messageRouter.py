from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.messageController import MessageController
from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.userModel import UserModel
from app.schemas.message import MessageCreate, MessageRead
from app.services.messageService import MessageService

router = APIRouter(prefix="/messages", tags=["Messages"])


def get_service(db: Session = Depends(get_db)) -> MessageService:
    return MessageService(db)


@router.get("/appointment/{appointment_id}", response_model=List[MessageRead])
def list_appointment_messages(
    appointment_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: MessageService = Depends(get_service),
):
    return MessageController.list_for_appointment(appointment_id, current_user, service)


@router.post("/appointment/{appointment_id}", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_appointment_message(
    appointment_id: str,
    data: MessageCreate,
    current_user: UserModel = Depends(get_current_user),
    service: MessageService = Depends(get_service),
):
    return MessageController.send_to_appointment(appointment_id, data.body, current_user, service)


@router.get("/telemedicine/{consultation_id}", response_model=List[MessageRead])
def list_consultation_messages(
    consultation_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: MessageService = Depends(get_service),
):
    return MessageController.list_for_consultation(consultation_id, current_user, service)


@router.post("/telemedicine/{consultation_id}", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_consultation_message(
    consultation_id: str,
    data: MessageCreate,
    current_user: UserModel = Depends(get_current_user),
    service: MessageService = Depends(get_service),
):
    return MessageController.send_to_consultation(consultation_id, data.body, current_user, service)
