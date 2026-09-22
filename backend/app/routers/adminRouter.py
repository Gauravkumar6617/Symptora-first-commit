from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.controllers.adminController import AdminController
from app.core.database import get_db
from app.deps.auth import get_current_admin
from app.models.userModel import UserModel
from app.schemas.clinic import ClinicBase, ClinicRead
from app.schemas.doctor import AdminDoctorRead
from app.schemas.userSchema import UserResponse
from app.services.adminService import AdminService

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_admin_service(db: Session = Depends(get_db)) -> AdminService:
    return AdminService(db)


@router.get("/stats")
def get_stats(
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Counts for the dashboard header: patients, approved doctors, clinics,
    and doctor applications still awaiting review."""
    return AdminController.get_stats(service)


@router.get("/patients", response_model=List[UserResponse])
def list_patients(
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return AdminController.list_patients(service)


@router.get("/doctors", response_model=List[AdminDoctorRead])
def list_doctors(
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Every approved doctor, with the clinics they're linked to."""
    return AdminController.list_doctors(service)


@router.get("/clinics", response_model=List[ClinicRead])
def list_clinics(
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Same data as GET /clinics, kept under /admin for a single base URL
    on the dashboard."""
    return AdminController.list_clinics(service)


@router.post("/clinics", response_model=ClinicRead, status_code=status.HTTP_201_CREATED)
def create_clinic(
    clinic_data: ClinicBase,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Creates the clinic's Organization in Medplum, then the local row."""
    return AdminController.create_clinic(clinic_data, service)
