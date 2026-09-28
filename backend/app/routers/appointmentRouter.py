from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.appointmentController import AppointmentController
from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.userModel import UserModel
from app.schemas.appointment import AppointmentCreate, AppointmentCreateByService, AppointmentRead
from app.services.appointmentService import AppointmentService

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def book_appointment(
    data: AppointmentCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Book a clinic appointment for the caller or a family member. Best-effort
    creates a Google Meet invite for the confirmed slot."""
    return AppointmentController.book(data, current_user, AppointmentService(db))


@router.post("/by-service", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def book_appointment_by_service(
    data: AppointmentCreateByService,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Book a clinic + service without picking a doctor — the first approved
    doctor at that clinic offering the service who's free at that day/slot
    gets the appointment."""
    return AppointmentController.book_by_service(data, current_user, AppointmentService(db))


@router.get("/me", response_model=List[AppointmentRead])
def list_my_appointments(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AppointmentController.list_mine(current_user, AppointmentService(db))


@router.get("/doctor/me", response_model=List[AppointmentRead])
def list_my_patient_appointments(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Appointments booked with the calling (approved) doctor."""
    return AppointmentController.list_for_doctor(current_user, AppointmentService(db))


@router.patch("/{appointment_id}/cancel", response_model=AppointmentRead)
def cancel_appointment(
    appointment_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The patient, the treating doctor, or an admin may cancel."""
    return AppointmentController.cancel(appointment_id, current_user, AppointmentService(db))
