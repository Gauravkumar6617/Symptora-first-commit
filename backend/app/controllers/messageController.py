from fastapi import HTTPException, status

from app.services.messageService import MessageService


class MessageController:

    @staticmethod
    def list_for_appointment(appointment_id: str, current_user, service: MessageService):
        try:
            return service.list_for_appointment(appointment_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    @staticmethod
    def list_for_consultation(consultation_id: str, current_user, service: MessageService):
        try:
            return service.list_for_consultation(consultation_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    @staticmethod
    def send_to_appointment(appointment_id: str, body: str, current_user, service: MessageService):
        try:
            return service.send_to_appointment(appointment_id, body, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    @staticmethod
    def send_to_consultation(consultation_id: str, body: str, current_user, service: MessageService):
        try:
            return service.send_to_consultation(consultation_id, body, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
