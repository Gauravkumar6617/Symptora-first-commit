import smtplib
from email.mime.text import MIMEText
from app.core.config import settings

def send_otp_email(to_email: str, otp: str):
    msg = MIMEText(f"Your OTP is: {otp}. It expires in {settings.OTP_EXPIRY_SECONDS // 60} minutes.")
    msg["Subject"] = "Your OTP Code"
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)