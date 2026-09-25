from fastapi import HTTPException, status
from app.services.clinicService import CliniService


class ClinicController:

    @staticmethod
    def list_clinics(service: CliniService):
        try:
            return service.list_clinics()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Listing clinics failed: {e}",
            )

    @staticmethod
    def directory(service: CliniService):
        return service.directory()
