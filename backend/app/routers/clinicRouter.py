from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.clinicController import ClinicController
from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.userModel import UserModel
from app.schemas.clinic import ClinicRead
from app.services.clinicService import CliniService

router = APIRouter(prefix="/clinics", tags=["Clinics"])


@router.get("", response_model=List[ClinicRead])
def list_clinics(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """All clinics, e.g. for a doctor picking one to join."""
    service = CliniService(db)
    return ClinicController.list_clinics(service)
