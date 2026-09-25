import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.controllers.predictionController import PredictionController
from app.deps.auth import get_current_user
from app.models.userModel import UserModel
from app.schemas.prediction import (
    ParseRequest,
    ParseResponse,
    PredictRequest,
    PredictResponse,
    SymptomRead,
)
from app.services.predictionService import PredictionService, get_prediction_service

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
def predict(
    data: PredictRequest,
    current_user: UserModel = Depends(get_current_user),
    service: PredictionService = Depends(get_service),
):
    """Top 3 likely conditions for the given symptoms, with description and precautions."""
    return PredictionController.predict(data, service)
