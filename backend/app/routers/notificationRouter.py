from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.userModel import UserModel
from app.schemas.notification import NotificationRead
from app.services import notificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationRead])
def list_notifications(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Latest 30, newest first. The web app polls this for the bell icon."""
    return notificationService.list_for_user(db, current_user.id)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def read_all_notifications(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    notificationService.mark_all_read(db, current_user.id)
