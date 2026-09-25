"""Email delivery for verification codes and family invites."""

import smtplib
from html import escape
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
    text = f"Your Symptora verification code is {otp}. It expires in {settings.OTP_EXPIRY_SECONDS // 60} minutes."
    _send(to_email, "Verify your Symptora email", text, _otp_email_html(otp), settings.FROM_EMAIL)


def _family_invite_html(otp: str, owner_name: str, member_name: str) -> str:
    expiry_minutes = max(1, settings.OTP_EXPIRY_SECONDS // 60)
    promo = settings.INVITE_PROMO_URL.strip()
    promo_html = (
        f'<p style="color:#667085;font-size:13px">Sent by <a href="{escape(promo)}" style="color:#1967d2">'
        f"{escape(promo.split('//')[-1].rstrip('/'))}</a></p>"
        if promo
        else ""
    )
    return f"""<!doctype html>
<html><body style=\"margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033\">
  <div style=\"max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden\">
    <div style=\"padding:24px 32px;background:#1967d2;color:#ffffff\"><h1 style=\"margin:0;font-size:24px\">Symptora</h1></div>
    <div style=\"padding:32px\"><h2 style=\"margin-top:0\">Hi {escape(member_name)}, you've been added to a family account</h2>
      <p>{escape(owner_name)} added you as a family member on Symptora. Activate your own login to see your health checks and run new ones.</p>
      <p>In the Symptora app or website, choose <b>Log in &rarr; Activate family account</b> and enter this code:</p>
      <p style=\"margin:28px 0;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1967d2\">{otp}</p>
      <p>This code expires in {expiry_minutes} minute{'s' if expiry_minutes != 1 else ''}. You can request a new one from the same screen.</p>
      <p style=\"color:#667085;font-size:13px\">If you don't know {escape(owner_name)}, you can safely ignore this email.</p>
      {promo_html}
    </div>
  </div>
</body></html>"""


def send_family_invite_email(to_email: str, otp: str, owner_name: str, member_name: str) -> None:
    text = (
        f"{owner_name} added you as a family member on Symptora. To activate your own login, "
        f"choose Log in > Activate family account and enter the code {otp}. "
        f"It expires in {max(1, settings.OTP_EXPIRY_SECONDS // 60)} minutes."
    )
    if settings.INVITE_PROMO_URL.strip():
        text += f"\n\nSent by {settings.INVITE_PROMO_URL.strip()}"
    sender = settings.INVITE_FROM_EMAIL or settings.FROM_EMAIL
    _send(
        to_email,
        f"{owner_name} invited you to Symptora",
        text,
        _family_invite_html(otp, owner_name, member_name),
        sender,
        reply_to=sender,
    )


def _send(to_email: str, subject: str, text: str, html: str, sender: str, reply_to: str | None = None) -> None:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD or not sender:
        raise RuntimeError("SMTP credentials are not configured.")

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to_email
    # Gmail rewrites From unless the address is a verified alias; Reply-To still holds.
    if reply_to:
        message["Reply-To"] = reply_to
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)
