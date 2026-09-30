from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.newsletterModel import NewsletterSubscriberModel

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


class SubscribeRequest(BaseModel):
    email: EmailStr


class UnsubscribeRequest(BaseModel):
    token: str = Field(min_length=10, max_length=64)


@router.post("/subscribe")
def subscribe(data: SubscribeRequest, db: Session = Depends(get_db)):
    """Public. Same answer whether the email is new, already subscribed or
    coming back after unsubscribing, so it can't be used to look people up."""
    email = data.email.strip().lower()
    subscriber = db.query(NewsletterSubscriberModel).filter_by(email=email).first()
    if subscriber is None:
        db.add(NewsletterSubscriberModel(email=email))
    else:
        subscriber.active = True
    db.commit()
    return {"detail": "You're subscribed. Look out for our next issue."}


@router.post("/unsubscribe")
def unsubscribe(data: UnsubscribeRequest, db: Session = Depends(get_db)):
    """The link in every newsletter email lands on the web page that calls this."""
    subscriber = db.query(NewsletterSubscriberModel).filter_by(unsubscribe_token=data.token).first()
    if subscriber is not None:
        subscriber.active = False
        db.commit()
    return {"detail": "You've been unsubscribed. You won't get any more newsletters."}
