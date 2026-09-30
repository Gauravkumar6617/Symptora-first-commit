from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, Response, status
from sqlalchemy.orm import Session

from app.controllers.prescriptionController import PrescriptionController
from app.core.database import get_db
from app.deps.auth import get_current_user
from app.deps.medplum import get_medplum_integration
from app.models.userModel import UserModel
from app.schemas.prescription import PrescriptionCreate, PrescriptionRead
from app.routers.callRouter import force_end_call
from app.services.telemedicineService import finish_encounter_in_medplum
from app.services.prescriptionService import (
    PrescriptionService,
    email_prescription_ready,
    prescription_pdf,
    sync_prescription_to_medplum,
)
from app.utils.integration.medplum.index import MedplumIntegration

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


def get_service(db: Session = Depends(get_db)) -> PrescriptionService:
    return PrescriptionService(db)


@router.post("", response_model=PrescriptionRead, status_code=status.HTTP_201_CREATED)
def issue_prescription(
    data: PrescriptionCreate,
    background: BackgroundTasks,
    current_user: UserModel = Depends(get_current_user),
    service: PrescriptionService = Depends(get_service),
    medplum: MedplumIntegration = Depends(get_medplum_integration),
):
    """The treating doctor issues an e-prescription for an appointment or
    instant consultation; best-effort synced to Medplum as MedicationRequests."""
    prescription = PrescriptionController.issue(data, current_user, service)
    background.add_task(sync_prescription_to_medplum, prescription.id, medplum)
    background.add_task(email_prescription_ready, prescription.id)
    # Issuing it completed the consultation; close its Medplum Encounter too.
    consultation = prescription.consultation
    if consultation is not None:
        # The consultation is complete: close the live call for both sides.
        background.add_task(force_end_call, f"telemedicine:{consultation.id}")
        if consultation.medplum_encounter_id:
            background.add_task(finish_encounter_in_medplum, consultation.medplum_encounter_id, medplum)
    return prescription


@router.get("/me", response_model=List[PrescriptionRead])
def list_my_prescriptions(
    current_user: UserModel = Depends(get_current_user),
    service: PrescriptionService = Depends(get_service),
):
    return PrescriptionController.list_mine(current_user, service)


@router.get("/doctor/me", response_model=List[PrescriptionRead])
def list_my_issued_prescriptions(
    current_user: UserModel = Depends(get_current_user),
    service: PrescriptionService = Depends(get_service),
):
    return PrescriptionController.list_for_doctor(current_user, service)


@router.get("/appointment/{appointment_id}", response_model=List[PrescriptionRead])
def list_appointment_prescriptions(
    appointment_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: PrescriptionService = Depends(get_service),
):
    return PrescriptionController.list_for_appointment(appointment_id, current_user, service)


@router.get("/telemedicine/{consultation_id}", response_model=List[PrescriptionRead])
def list_consultation_prescriptions(
    consultation_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: PrescriptionService = Depends(get_service),
):
    return PrescriptionController.list_for_consultation(consultation_id, current_user, service)


@router.get("/{prescription_id}", response_model=PrescriptionRead)
def get_prescription(
    prescription_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: PrescriptionService = Depends(get_service),
):
    return PrescriptionController.get(prescription_id, current_user, service)


@router.get("/{prescription_id}/pdf", response_class=Response)
def download_prescription_pdf(
    prescription_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: PrescriptionService = Depends(get_service),
):
    """The prescription as a one-page PDF, for the patient or the prescribing doctor."""
    prescription = PrescriptionController.get(prescription_id, current_user, service)
    return Response(
        prescription_pdf(prescription),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="prescription-{prescription.id[:8]}.pdf"'},
    )
