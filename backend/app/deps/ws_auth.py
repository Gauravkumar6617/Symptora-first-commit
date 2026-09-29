from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.models.userModel import UserModel


def get_ws_user(db: Session, token: str) -> UserModel | None:
    """Same checks as get_current_user, for a WebSocket route where the
    token arrives as a query param instead of an Authorization header."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    try:
        UUID(user_id)
    except (ValueError, TypeError):
        return None
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    return user if user and user.is_active else None
