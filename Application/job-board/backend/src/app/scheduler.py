# Background Task Scheduler
# Manages recurring background jobs using APScheduler.
# Periodically checks and expires pending job offers past their acceptance deadline.

import logging
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text
from app.database import SessionLocal
from app.models.application import Application, ApplicationStatus

logger = logging.getLogger("app.scheduler")

def check_expired_offers():
    """Background task to auto-expire offers past their 48-hour deadline with multi-worker advisory locking."""
    db = SessionLocal()
    is_postgres = (db.bind.dialect.name == "postgresql") if db.bind else False
    lock_acquired = False

    try:
        if is_postgres:
            lock_acquired = db.execute(text("SELECT pg_try_advisory_lock(987654)")).scalar()
            if not lock_acquired:
                return  # Another worker process is currently running this task

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
        db.rollback()
        logger.error(f"Error checking expired offers: {e}")
    finally:
        if is_postgres and lock_acquired:
            try:
                db.execute(text("SELECT pg_advisory_unlock(987654)"))
            except Exception as unlock_err:
                logger.warning(f"Advisory lock release notice: {unlock_err}")
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every 60 seconds
    scheduler.add_job(check_expired_offers, 'interval', seconds=60)
    scheduler.start()
    logger.info("APScheduler initialized: 48-Hour Offer Expiration Task active.")
    return scheduler
