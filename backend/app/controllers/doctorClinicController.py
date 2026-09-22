from fastapi import HTTPException, status
from app.services.doctorClinicService import DoctorClinicService
from app.models.userModel import UserModel


class DoctorClinicController:

    @staticmethod
    def assign_to_clinic(
        clinic_id: str,
        current_user: UserModel,
        service: DoctorClinicService,
    ):
        try:
            return service.assign_doctor_to_clinic(str(current_user.id), clinic_id)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Assigning doctor to clinic failed: {e}",
            )
