"""Pay-before-consult for instant telemedicine.

Razorpay test mode when RAZORPAY_KEY_ID/SECRET are set (no SDK: one HTTP call
to create the order, one HMAC to verify). Without keys it runs a simulated
gateway so the flow works in local dev; any payment id starting with "test_"
is accepted.
"""
import hashlib
import hmac
import uuid
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.models.telemedicineModel import TelemedicineConsultationModel

RAZORPAY_ORDERS = "https://api.razorpay.com/v1/orders"


def simulated() -> bool:
    return not (settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)


def create_order(consultation: TelemedicineConsultationModel) -> dict:
    """Start a payment for this consultation; the result is what the browser checkout needs."""
    if consultation.paid_at:
        raise ValueError("This consultation is already paid")
    amount = consultation.amount or settings.TELEMEDICINE_FEE
    if simulated():
        order_id = f"order_test_{uuid.uuid4().hex[:14]}"
    else:
        response = httpx.post(
            RAZORPAY_ORDERS,
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
            json={"amount": amount * 100, "currency": "INR", "receipt": consultation.id[:40]},
            timeout=15,
        )
        response.raise_for_status()
        order_id = response.json()["id"]
    consultation.amount = amount
    consultation.payment_ref = order_id
    return {
        "gateway": "simulated" if simulated() else "razorpay",
        "order_id": order_id,
        "amount": amount,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID or None,
    }


def verify(consultation: TelemedicineConsultationModel, order_id: str, payment_id: str, signature: str | None) -> None:
    """Mark paid if the gateway's signature checks out; ValueError otherwise."""
    if consultation.paid_at:
        return
    if not consultation.payment_ref or order_id != consultation.payment_ref:
        raise ValueError("Unknown payment order for this consultation")
    if simulated():
        ok = payment_id.startswith("test_")
    else:
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256
        ).hexdigest()
        ok = bool(signature) and hmac.compare_digest(expected, signature)
    if not ok:
        raise ValueError("Payment could not be verified")
    consultation.payment_ref = payment_id
    consultation.paid_at = datetime.now(timezone.utc)
