from fastapi import HTTPException, status

from app.schemas.prescription import PrescriptionCreate
from app.services.prescriptionService import PrescriptionService


class PrescriptionController:

    @staticmethod
    def issue(data: PrescriptionCreate, current_user, service: PrescriptionService):
        try:
            return service.issue(current_user, data)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get(prescription_id: str, current_user, service: PrescriptionService):
        try:
            return service.get_for_user(prescription_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    @staticmethod
    def list_mine(current_user, service: PrescriptionService):
        return service.list_for_patient(current_user.id)

    @staticmethod
    def list_for_doctor(current_user, service: PrescriptionService):
        try:
            return service.list_for_current_doctor(current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    @staticmethod
    def list_for_appointment(appointment_id: str, current_user, service: PrescriptionService):
        try:
            return service.list_for_appointment(appointment_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    @staticmethod
    def list_for_consultation(consultation_id: str, current_user, service: PrescriptionService):
        try:
            return service.list_for_consultation(consultation_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
