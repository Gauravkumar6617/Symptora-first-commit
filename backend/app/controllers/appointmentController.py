from fastapi import HTTPException, status

from app.schemas.appointment import AppointmentCreate, AppointmentCreateByService
from app.services.appointmentService import AppointmentService


class AppointmentController:

    @staticmethod
    def book(data: AppointmentCreate, current_user, service: AppointmentService):
        try:
            return service.book(current_user, data)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def book_by_service(data: AppointmentCreateByService, current_user, service: AppointmentService):
        try:
            return service.book_by_service(current_user, data)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def list_mine(current_user, service: AppointmentService):
        return service.list_for_patient(current_user.id)

    @staticmethod
    def list_for_doctor(current_user, service: AppointmentService):
        try:
            return service.list_for_current_doctor(current_user)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    def cancel(appointment_id: str, current_user, service: AppointmentService):
        try:
            return service.cancel(appointment_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
