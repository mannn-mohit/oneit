from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "oneit",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Scheduled tasks
celery_app.conf.beat_schedule = {
    "check-sla-breaches": {
        "task": "app.workers.celery_app.check_sla_breaches",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    "send-daily-digest": {
        "task": "app.workers.celery_app.send_daily_digest",
        "schedule": crontab(hour=9, minute=0),  # Daily at 9 AM
    },
}


@celery_app.task(name="app.workers.celery_app.send_email_notification")
def send_email_notification(
    to_email: str,
    subject: str,
    body: str,
):
    """
    Send an email notification.
    Placeholder: configure SMTP settings in .env for production use.
    """
    if not settings.SMTP_HOST:
        print(f"[EMAIL STUB] To: {to_email}, Subject: {subject}")
        return {"status": "skipped", "reason": "SMTP not configured"}

    # Production implementation:
    # import smtplib
    # from email.mime.text import MIMEText
    # msg = MIMEText(body)
    # msg["Subject"] = subject
    # msg["From"] = settings.SMTP_FROM_EMAIL
    # msg["To"] = to_email
    # with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
    #     server.starttls()
    #     server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    #     server.send_message(msg)
    return {"status": "sent", "to": to_email}


@celery_app.task(name="app.workers.celery_app.check_sla_breaches")
def check_sla_breaches():
    """
    Check for tickets that have breached their SLA.
    Sends escalation notifications.
    """
    from app.core.database import SessionLocal
    from app.models.ticket import Ticket
    from datetime import datetime, timezone

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        breached_tickets = db.query(Ticket).filter(
            Ticket.sla_due_at < now,
            Ticket.status.in_(["open", "in_progress"]),
        ).all()

        for ticket in breached_tickets:
            print(f"[SLA BREACH] Ticket {ticket.ticket_number}: SLA breached")
            # In production: send notification to assignee's manager
            # send_email_notification.delay(...)

        return {"breached_count": len(breached_tickets)}
    finally:
        db.close()


@celery_app.task(name="app.workers.celery_app.send_daily_digest")
def send_daily_digest():
    """
    Send daily digest of open tickets and asset statuses.
    Placeholder for daily report generation.
    """
    from app.core.database import SessionLocal
    from app.models.ticket import Ticket
    from app.models.asset import Asset
    from sqlalchemy import func

    db = SessionLocal()
    try:
        open_tickets = db.query(func.count(Ticket.id)).filter(
            Ticket.status.in_(["open", "in_progress"])
        ).scalar()

        total_assets = db.query(func.count(Asset.id)).scalar()

        print(f"[DAILY DIGEST] Open tickets: {open_tickets}, Total assets: {total_assets}")
        return {
            "open_tickets": open_tickets,
            "total_assets": total_assets,
        }
    finally:
        db.close()
