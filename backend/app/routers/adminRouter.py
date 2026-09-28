from typing import List

from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.controllers.adminController import AdminController
from app.controllers.doctorClinicController import DoctorClinicController
from app.core.database import get_db
from app.deps.auth import get_current_admin
from app.models.userModel import UserModel
from app.schemas.clinic import (
    AdminClinicRead,
    ClinicBase,
    ClinicPictureUpload,
    ClinicRead,
    ClinicUpdate,
    DoctorClinicRead,
)
from app.schemas.doctor import AdminDoctorRead, DoctorProfileUpdate
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate
from app.schemas.userSchema import UserResponse
from app.services.adminService import AdminService
from app.services.doctorClinicService import DoctorClinicService

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_admin_service(db: Session = Depends(get_db)) -> AdminService:
    return AdminService(db)


def get_doctor_clinic_service(db: Session = Depends(get_db)) -> DoctorClinicService:
    return DoctorClinicService(db)


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


@router.patch("/doctors/{doctor_id}", response_model=AdminDoctorRead)
def update_doctor(
    doctor_id: str,
    data: DoctorProfileUpdate,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Edit an approved doctor's contact info and weekly availability."""
    AdminController.update_doctor(doctor_id, data, service)
    return next(d for d in service.list_doctors() if d.id == doctor_id)


@router.get("/clinics", response_model=List[AdminClinicRead])
def list_clinics(
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Every clinic with its picture url and linked (approved) doctors."""
    return AdminController.list_clinics(service)


@router.post("/clinics", response_model=ClinicRead, status_code=status.HTTP_201_CREATED)
def create_clinic(
    clinic_data: ClinicBase,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Creates the clinic's Organization in Medplum, then the local row."""
    return AdminController.create_clinic(clinic_data, service)


@router.post("/clinics/picture", response_model=ClinicPictureUpload, status_code=status.HTTP_201_CREATED)
def upload_clinic_picture(
    file: UploadFile = File(...),
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Store a clinic photo (png/jpeg/webp); send the returned key as ``picture``."""
    return AdminController.upload_clinic_picture(file, service)


@router.patch("/clinics/{clinic_id}", response_model=ClinicRead)
def update_clinic(
    clinic_id: str,
    data: ClinicUpdate,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Edit a clinic; its Medplum Organization is updated first."""
    return AdminController.update_clinic(clinic_id, data, service)


@router.delete("/clinics/{clinic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_clinic(
    clinic_id: str,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Remove a clinic and unlink its doctors (also removed from Medplum)."""
    AdminController.delete_clinic(clinic_id, service)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/clinics/{clinic_id}/doctors/{doctor_id}",
    response_model=DoctorClinicRead,
    status_code=status.HTTP_201_CREATED,
)
def assign_doctor_to_clinic(
    clinic_id: str,
    doctor_id: str,
    current_admin: UserModel = Depends(get_current_admin),
    service: DoctorClinicService = Depends(get_doctor_clinic_service),
):
    """Link an approved doctor to a clinic, creating a PractitionerRole in Medplum."""
    return DoctorClinicController.admin_assign(doctor_id, clinic_id, service)


@router.delete(
    "/clinics/{clinic_id}/doctors/{doctor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unassign_doctor_from_clinic(
    clinic_id: str,
    doctor_id: str,
    current_admin: UserModel = Depends(get_current_admin),
    service: DoctorClinicService = Depends(get_doctor_clinic_service),
):
    """Unlink a doctor from a clinic."""
    DoctorClinicController.admin_unassign(doctor_id, clinic_id, service)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/services", response_model=List[ServiceRead])
def list_services(
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    """Every bookable service (e.g. "Regular Health Checkup")."""
    return AdminController.list_services(service)


@router.post("/services", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return AdminController.create_service(data, service)


@router.patch("/services/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: str,
    data: ServiceUpdate,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    return AdminController.update_service(service_id, data, service)


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: str,
    current_admin: UserModel = Depends(get_current_admin),
    service: AdminService = Depends(get_admin_service),
):
    AdminController.delete_service(service_id, service)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
