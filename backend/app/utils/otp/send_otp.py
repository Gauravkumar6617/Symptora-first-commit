"""Email delivery for registration verification codes."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _otp_email_html(otp: str) -> str:
    expiry_minutes = max(1, settings.OTP_EXPIRY_SECONDS // 60)
    return f"""<!doctype html>
<html><body style=\"margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033\">
  <div style=\"max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden\">
    <div style=\"padding:24px 32px;background:#1967d2;color:#ffffff\"><h1 style=\"margin:0;font-size:24px\">Symptora</h1></div>
    <div style=\"padding:32px\"><h2 style=\"margin-top:0\">Verify your email address</h2>
      <p>Use this code to finish creating your account:</p>
      <p style=\"margin:28px 0;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1967d2\">{otp}</p>
      <p>This code expires in {expiry_minutes} minute{'s' if expiry_minutes != 1 else ''}. Do not share it with anyone.</p>
      <p style=\"color:#667085;font-size:13px\">If you did not start a Symptora registration, you can safely ignore this email.</p>
    </div>
  </div>
</body></html>"""


def send_otp_email(to_email: str, otp: str) -> None:
    """Send a styled HTML email with a plaintext fallback."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD or not settings.FROM_EMAIL:
        raise RuntimeError("SMTP credentials are not configured.")

    message = MIMEMultipart("alternative")
    message["Subject"] = "Verify your Symptora email"
    message["From"] = settings.FROM_EMAIL
    message["To"] = to_email
    text = f"Your Symptora verification code is {otp}. It expires in {settings.OTP_EXPIRY_SECONDS // 60} minutes."
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(_otp_email_html(otp), "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)
