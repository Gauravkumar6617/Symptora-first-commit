from typing import List, Optional

from app.controllers.doctorController import DoctorController
from app.services.doctorService import DoctorService
from app.controllers.doctorClinicController import DoctorClinicController
from app.services.doctorClinicService import DoctorClinicService
from app.schemas.clinic import DoctorClinicRead
from app.schemas.doctor import (
    DoctorProfileCreate,
    DoctorAvailabilityRead,
    DoctorProfileBase,
    DoctorProfileRead,
    DoctorProfileUpdate,
)
from app.core.database import get_db
from app.deps.auth import get_current_admin, get_current_user
from app.models.userModel import UserModel
from fastapi import HTTPException, APIRouter, status, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/doctor", tags=["Doctor"])


@router.post(
    "/promote",
    response_model=DoctorProfileRead,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_become_doctor(
    doctor_data: DoctorProfileCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a doctor application. It stays pending — and the account stays a
    regular user — until an admin approves it via /doctor/{doctor_id}/approve."""
    service = DoctorService(db)
    return DoctorController.apply_to_become_doctor(doctor_data, current_user, service)


@router.get(
    "/me",
    response_model=Optional[DoctorProfileRead],
)
def get_my_doctor_application(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The caller's own doctor application, or null if they never applied."""
    service = DoctorService(db)
    return DoctorController.get_my_application(current_user, service)


@router.get(
    "/pending",
    response_model=List[DoctorProfileRead],
)
def list_pending_doctor_applications(
    current_admin: UserModel = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    service = DoctorService(db)
    return DoctorController.list_pending_applications(current_admin, service)


@router.patch(
    "/{doctor_id}/approve",
    response_model=DoctorProfileRead,
)
def approve_doctor_application(
    doctor_id: str,
    current_admin: UserModel = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    service = DoctorService(db)
    return DoctorController.approve_doctor(doctor_id, current_admin, service)


@router.patch(
    "/{doctor_id}/reject",
    response_model=DoctorProfileRead,
)
def reject_doctor_application(
    doctor_id: str,
    current_admin: UserModel = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    service = DoctorService(db)
    return DoctorController.reject_doctor(doctor_id, current_admin, service)


@router.post(
    "/clinics/{clinic_id}/assign",
    response_model=DoctorClinicRead,
    status_code=status.HTTP_201_CREATED,
)
def assign_doctor_to_clinic(
    clinic_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Link the calling (approved) doctor to a clinic, creating a
    PractitionerRole in Medplum."""
    service = DoctorClinicService(db)
    return DoctorClinicController.assign_to_clinic(clinic_id, current_user, service)


@router.get(
    "/my-clinics",
    response_model=List[DoctorClinicRead],
)
def list_my_clinics(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clinics the calling doctor is currently assigned to."""
    service = DoctorClinicService(db)
    return DoctorClinicController.list_my_clinics(current_user, service)
