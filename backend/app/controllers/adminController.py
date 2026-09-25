from fastapi import HTTPException, status

from app.schemas.clinic import ClinicBase, ClinicUpdate
from app.services.adminService import AdminService, ClinicNotFoundError

CLINIC_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found.")


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

    @staticmethod
    def upload_clinic_picture(file, service: AdminService):
        # Upload errors (size, type, bad image, storage) keep their status.
        return service.upload_clinic_picture(file)

    @staticmethod
    def update_clinic(clinic_id: str, data: ClinicUpdate, service: AdminService):
        try:
            return service.update_clinic(clinic_id, data)
        except ClinicNotFoundError:
            raise CLINIC_NOT_FOUND
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def delete_clinic(clinic_id: str, service: AdminService):
        try:
            service.delete_clinic(clinic_id)
        except ClinicNotFoundError:
            raise CLINIC_NOT_FOUND
