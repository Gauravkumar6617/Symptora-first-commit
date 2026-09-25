from fastapi import HTTPException, status

from app.schemas.prediction import ParseRequest, PredictRequest
from app.services.predictionService import PredictionService, UnknownSymptomError


class PredictionController:

    @staticmethod
    def list_symptoms(service: PredictionService):
        return service.list_symptoms()

    @staticmethod
    def parse(data: ParseRequest, service: PredictionService):
        return service.parse(data.text)

    @staticmethod
    def predict(data: PredictRequest, service: PredictionService):
        try:
            return service.predict(
                data.symptoms, age=data.age, duration=data.duration, description=data.description
            )
        except UnknownSymptomError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unknown symptoms: {', '.join(e.unknown)}. Pick from GET /symptoms.",
            )
