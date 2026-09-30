from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.models.enumModel import ConsultationStatus, ConsultationTrigger
from app.schemas.common import ORMReadBase


class TelemedicineStart(BaseModel):
    """Patient starts an instant consultation — just who it's for and why;
    everything else (name/email/phone) is read off their own account."""

    family_member_id: Optional[str] = None
    reason: str = Field(min_length=3, max_length=255)


class TelemedicineRead(ORMReadBase):
    patient_id: str
    family_member_id: Optional[str] = None
    doctor_profile_id: Optional[str] = None
    reason: str
    status: ConsultationStatus
    trigger: ConsultationTrigger
    symptom_check_id: Optional[str] = None
    amount: Optional[int] = None  # rupees
    paid_at: Optional[datetime] = None  # null = waiting for payment, not yet in the doctor queue

    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None


class PaymentOrder(BaseModel):
    """What the browser needs to open checkout. gateway "simulated" = no
    Razorpay keys configured; confirm with any payment_id starting "test_"."""

    gateway: Literal["razorpay", "simulated"]
    order_id: str
    amount: int  # rupees
    currency: str
    key_id: Optional[str] = None


class PaymentConfirm(BaseModel):
    order_id: str = Field(max_length=100)
    payment_id: str = Field(max_length=100)
    signature: Optional[str] = Field(None, max_length=200)
