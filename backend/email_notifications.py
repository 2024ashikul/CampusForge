"""SMTP delivery for member announcement notifications.

Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM in the
backend environment to enable delivery. Leaving SMTP_HOST unset keeps local
development safe: announcements are still published but no email is sent.
"""
import logging
import os
import smtplib
from email.message import EmailMessage
from typing import Iterable
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def email_delivery_enabled() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM"))


def send_announcement_emails(
    recipients: Iterable[str], *, organization_name: str, announcement_title: str,
    announcement_body: str, announcement_kind: str,
) -> None:
    """Send one addressed email per recipient; failures do not undo a post."""
    recipients = list(dict.fromkeys(email for email in recipients if email))
    if not recipients or not email_delivery_enabled():
        return

    host = os.environ["SMTP_HOST"]
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.environ["SMTP_FROM"]
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() not in {"0", "false", "no"}

    try:
        with smtplib.SMTP(host, port, timeout=20) as server:
            if use_tls:
                server.starttls()
            if username and password:
                server.login(username, password)
            for recipient in recipients:
                message = EmailMessage()
                message["Subject"] = f"[{organization_name}] {announcement_title}"
                message["From"] = sender
                message["To"] = recipient
                message.set_content(
                    f"New {announcement_kind} announcement from {organization_name}\n\n"
                    f"{announcement_title}\n\n{announcement_body}\n\n"
                    "You are receiving this because you are an approved member or attendee."
                )
                try:
                    server.send_message(message)
                except Exception:
                    logger.exception("Could not deliver announcement email to %s", recipient)
    except Exception:
        logger.exception("Could not connect to the configured SMTP server")
