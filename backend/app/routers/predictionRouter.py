import logging
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.controllers.predictionController import PredictionController
from app.core.database import get_db
from app.deps.auth import get_current_user
from app.deps.medplum import get_medplum_integration
from app.models.userModel import UserModel
from app.schemas.prediction import (
    ParseRequest,
    ParseResponse,
    PredictRequest,
    PredictResponse,
    SymptomCheckRead,
    SymptomRead,
)
from app.services.familyMemberService import FamilyMemberNotFoundError
from app.services.predictionService import PredictionService, get_prediction_service
from app.services.symptomCheckService import SymptomCheckService, sync_check_to_medplum
from app.services.telemedicineService import email_doctors_patient_waiting
from app.services import telemedicineNotifier as notifier
from app.services.telemedicineService import TelemedicineService
from app.schemas.telemedicine import TelemedicineRead
from app.utils.integration.medplum.index import MedplumIntegration

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Symptom checker"])


def get_service() -> PredictionService:
    try:
        return get_prediction_service()
    except FileNotFoundError:
        logger.exception("Symptom model files missing; run `python ml/train.py`")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Symptom checker is not available right now.",
        )


def get_check_service(
    db: Session = Depends(get_db),
    medplum: MedplumIntegration = Depends(get_medplum_integration),
) -> SymptomCheckService:
    return SymptomCheckService(db, medplum)


MEMBER_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found.")


@router.get("/symptoms", response_model=List[SymptomRead])
def list_symptoms(
    current_user: UserModel = Depends(get_current_user),
    service: PredictionService = Depends(get_service),
):
    """All symptoms the model knows, for the frontend picker / autocomplete."""
    return PredictionController.list_symptoms(service)


@router.post("/symptoms/parse", response_model=ParseResponse)
def parse_symptoms(
    data: ParseRequest,
    current_user: UserModel = Depends(get_current_user),
    service: PredictionService = Depends(get_service),
):
    """Free text ("vomiting for two days and there's blood") -> symptoms to confirm."""
    return PredictionController.parse(data, service)


@router.post("/predict", response_model=PredictResponse)
async def predict(
    data: PredictRequest,
    background: BackgroundTasks,
    current_user: UserModel = Depends(get_current_user),
    service: PredictionService = Depends(get_service),
    checks: SymptomCheckService = Depends(get_check_service),
    db: Session = Depends(get_db),
):
    """Top 3 likely conditions for the given symptoms, with description and precautions.

    The result is saved to the patient's history and sent to Medplum in the
    background. A "high" urgency result also auto-escalates to an instant
    video consultation — every available doctor is notified immediately.
    """
    try:
        member = checks.member_for(current_user, data.family_member_id)
    except FamilyMemberNotFoundError:
        raise MEMBER_NOT_FOUND
    result = PredictionController.predict(data, service)
    check = checks.save(current_user, member, data, result)
    if checks.medplum is not None:
        background.add_task(sync_check_to_medplum, check.id, checks.medplum)

    escalated_id = None
    if result["urgency"] == "high":
        escalated_id = await _escalate_to_telemedicine(db, current_user, member, result, check.id)
        if escalated_id:
            background.add_task(email_doctors_patient_waiting, escalated_id)

    return {**result, "check_id": check.id, "escalated_consultation_id": escalated_id}


async def _escalate_to_telemedicine(db: Session, current_user, member, result: dict, check_id: str) -> str | None:
    """Best-effort — a patient who can't start a consultation (e.g. is a
    doctor testing their own symptoms) just doesn't get one; the check
    itself has already been saved either way."""
    try:
        top = result["predictions"][0]["label"] if result.get("predictions") else "your symptoms"
        reason = f"Auto-escalated (High risk): {top}"[:255]
        consultation = TelemedicineService(db).escalate(current_user, member, reason, check_id)
        await notifier.notify_doctors_new_consultation(
            TelemedicineRead.model_validate(consultation).model_dump(mode="json")
        )
        return consultation.id
    except PermissionError:
        return None
    except Exception:
        logger.exception("Check %s: could not auto-escalate to telemedicine", check_id)
        return None


@router.get("/checks", response_model=List[SymptomCheckRead])
def list_checks(
    member_id: str | None = Query(None, description="Only checks about this family member"),
    current_user: UserModel = Depends(get_current_user),
    service: PredictionService = Depends(get_service),
    checks: SymptomCheckService = Depends(get_check_service),
):
    """Health-check history: yours, the ones you ran for family, and the ones family ran about you."""
    try:
        found = checks.visible_to(current_user, member_id)
    except FamilyMemberNotFoundError:
        raise MEMBER_NOT_FOUND
    member_ids = checks.viewer_member_ids(current_user)
    return [checks.to_read(c, current_user, service, member_ids) for c in found]
