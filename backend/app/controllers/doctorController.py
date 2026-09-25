from fastapi import HTTPException, status
from app.services.doctorService import DoctorService
from app.schemas.doctor import DoctorProfileCreate
from app.models.userModel import UserModel


class PromoteToDoctorError(HTTPException):
    pass


class DoctorController:

    @staticmethod
    def apply_to_become_doctor(
        doctor_data: DoctorProfileCreate,
        current_user: UserModel,
        service: DoctorService,
    ):
        try:
            return service.apply_to_become_doctor(str(current_user.id), doctor_data)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except PromoteToDoctorError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Doctor application failed: {e}",
            )

    @staticmethod
    def get_my_application(current_user: UserModel, service: DoctorService):
        return service.get_my_application(str(current_user.id))

    @staticmethod
    def list_pending_applications(current_admin: UserModel, service: DoctorService):
        try:
            return service.list_pending_applications(current_admin)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    @staticmethod
    def approve_doctor(doctor_id: str, current_admin: UserModel, service: DoctorService):
        try:
            return service.approve_doctor(current_admin, doctor_id)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Approving doctor failed: {e}",
            )

    @staticmethod
    def reject_doctor(doctor_id: str, current_admin: UserModel, service: DoctorService):
        try:
            return service.reject_doctor(current_admin, doctor_id)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
