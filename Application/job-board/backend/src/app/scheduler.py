import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.models.application import Application, ApplicationStatus

logger = logging.getLogger("app.scheduler")

def check_expired_offers():
    """Background task to auto-expire offers past their 48-hour deadline."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        expired_apps = (
            db.query(Application)
            .filter(
                Application.status == ApplicationStatus.offer_issued,
                Application.offer_expires_at.is_not(None),
                Application.offer_expires_at <= now,
                Application.deleted_at.is_(None)
            )
            .all()
        )

        for app in expired_apps:
            logger.info(f"Offer for Application #{app.application_id} expired. Auto-updating status to expired.")
            app.status = ApplicationStatus.expired

        if expired_apps:
            db.commit()
    except Exception as e:
        logger.error(f"Error checking expired offers: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every 60 seconds
    scheduler.add_job(check_expired_offers, 'interval', seconds=60)
    scheduler.start()
    logger.info("APScheduler initialized: 48-Hour Offer Expiration Task active.")
    return scheduler
