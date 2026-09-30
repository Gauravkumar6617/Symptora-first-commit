from sqlalchemy.orm import Session

from app.models.notificationModel import NotificationModel


def notify(db: Session, user_id: str | None, title: str, body: str = "", link: str | None = None) -> None:
    """Add an in-app notification. Skipped if the same one is still unread,
    so a reconnecting call or a burst of messages doesn't flood the bell."""
    if not user_id:
        return
    duplicate = (
        db.query(NotificationModel.id)
        .filter_by(user_id=user_id, title=title, link=link, read=False)
        .first()
    )
    if duplicate:
        return
    db.add(NotificationModel(user_id=user_id, title=title[:255], body=body[:500], link=link))
    db.commit()


def list_for_user(db: Session, user_id: str, limit: int = 30) -> list[NotificationModel]:
    return (
        db.query(NotificationModel)
        .filter_by(user_id=user_id)
        .order_by(NotificationModel.created_at.desc())
        .limit(limit)
        .all()
    )


def mark_all_read(db: Session, user_id: str) -> None:
    db.query(NotificationModel).filter_by(user_id=user_id, read=False).update({"read": True})
    db.commit()
