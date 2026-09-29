from fastapi import HTTPException, status

from app.schemas.telemedicine import TelemedicineStart
from app.services.telemedicineService import TelemedicineService


class TelemedicineController:

    @staticmethod
    def start(data: TelemedicineStart, current_user, service: TelemedicineService):
        try:
            return service.start(current_user, data)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def accept(consultation_id: str, current_user, service: TelemedicineService):
        try:
            return service.accept(current_user, consultation_id)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    @staticmethod
    def cancel(consultation_id: str, current_user, service: TelemedicineService):
        try:
            return service.cancel(consultation_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def complete(consultation_id: str, current_user, service: TelemedicineService):
        try:
            return service.complete(consultation_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def get(consultation_id: str, current_user, service: TelemedicineService):
        try:
            return service.get_for_user(consultation_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    @staticmethod
    def list_pending(current_user, service: TelemedicineService):
        try:
            return service.list_pending_for_doctor(current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    @staticmethod
    def list_mine(current_user, service: TelemedicineService):
        return service.list_for_patient(current_user.id)

    @staticmethod
    def list_for_doctor(current_user, service: TelemedicineService):
        try:
            return service.list_for_current_doctor(current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
