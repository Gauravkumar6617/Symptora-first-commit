from fastapi import HTTPException, status

from app.schemas.clinic import ClinicBase
from app.services.adminService import AdminService


class AdminController:

    @staticmethod
    def get_stats(service: AdminService):
        try:
            return service.get_stats()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Loading admin stats failed: {e}",
            )

    @staticmethod
    def list_patients(service: AdminService):
        try:
            return service.list_patients()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Listing patients failed: {e}",
            )

    @staticmethod
    def list_doctors(service: AdminService):
        try:
            return service.list_doctors()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Listing doctors failed: {e}",
            )

    @staticmethod
    def list_clinics(service: AdminService):
        try:
            return service.list_clinics()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Listing clinics failed: {e}",
            )

    @staticmethod
    def create_clinic(clinic_data: ClinicBase, service: AdminService):
        try:
            return service.create_clinic(clinic_data)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except HTTPException:
            # Preserve Medplum's upstream status code.
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Creating clinic failed: {e}",
            )
