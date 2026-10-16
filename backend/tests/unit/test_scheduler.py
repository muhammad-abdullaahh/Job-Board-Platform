from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from app.scheduler import check_expired_offers, start_scheduler
import app.scheduler
from app.models.user import User
from app.models.company import Company
from app.models.job import Job, EmploymentType, JobStatus
from app.models.application import Application, ApplicationStatus

def test_check_expired_offers_logic(db_session, monkeypatch):
    # Route SessionLocal to our test db_session
    monkeypatch.setattr(db_session, "close", lambda: None)
    monkeypatch.setattr(app.scheduler, "SessionLocal", lambda: db_session)

    user1 = User(name="Cand1", email="cand1@example.com", password="hash")
    user2 = User(name="Cand2", email="cand2@example.com", password="hash")
    employer = User(name="Emp", email="emp@example.com", password="hash")
    db_session.add_all([user1, user2, employer])
    db_session.commit()

    company = Company(name="SchedCo", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        title="Sched Job",
        description="Sched job description",
        company_id=company.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=employer.user_id
    )
    db_session.add(job)
    db_session.commit()

    now = datetime.now(timezone.utc)
    # Expired offer for candidate 1
    expired_app = Application(
        job_id=job.job_id,
        user_id=user1.user_id,
        cover_letter="Expired letter",
        status=ApplicationStatus.offer_issued,
        offer_issued_at=now - timedelta(hours=50),
        offer_expires_at=now - timedelta(hours=2)
    )
    # Active offer for candidate 2
    active_app = Application(
        job_id=job.job_id,
        user_id=user2.user_id,
        cover_letter="Active letter",
        status=ApplicationStatus.offer_issued,
        offer_issued_at=now - timedelta(hours=10),
        offer_expires_at=now + timedelta(hours=38)
    )
    db_session.add_all([expired_app, active_app])
    db_session.commit()

    check_expired_offers()

    db_session.refresh(expired_app)
    db_session.refresh(active_app)

    assert expired_app.status == ApplicationStatus.expired
    assert active_app.status == ApplicationStatus.offer_issued

def test_start_scheduler_invokes_apscheduler(monkeypatch):
    mock_sched = MagicMock()
    monkeypatch.setattr(app.scheduler, "BackgroundScheduler", lambda: mock_sched)

    sched = start_scheduler()
    assert sched == mock_sched
    assert mock_sched.add_job.called
    assert mock_sched.start.called
