from sqlalchemy.orm import Session

from app.models.messageModel import MessageModel


class MessageRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, sender_id: str, body: str, *, appointment_id: str | None, consultation_id: str | None) -> MessageModel:
        message = MessageModel(
            sender_id=sender_id,
            body=body,
            appointment_id=appointment_id,
            consultation_id=consultation_id,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_for_appointment(self, appointment_id: str) -> list[MessageModel]:
        return (
            self.db.query(MessageModel)
            .filter(MessageModel.appointment_id == appointment_id)
            .order_by(MessageModel.created_at.asc())
            .all()
        )

    def list_for_consultation(self, consultation_id: str) -> list[MessageModel]:
        return (
            self.db.query(MessageModel)
            .filter(MessageModel.consultation_id == consultation_id)
            .order_by(MessageModel.created_at.asc())
            .all()
        )
