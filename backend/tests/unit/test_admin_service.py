import pytest
from app.services.admin_service import AdminService
from app.models.user import User
from app.models.company import Company
from app.models.job import Job, EmploymentType, JobStatus
from app.models.application import Application, ApplicationStatus
from app.exceptions import JobNotFoundException

def test_admin_service_analytics(db_session):
    service = AdminService(db_session)

    # Seed users
    admin = User(name="Admin", email="admin@example.com", password="hash", is_admin=True)
    user = User(name="User", email="user@example.com", password="hash", is_admin=False)
    db_session.add_all([admin, user])
    db_session.commit()

    # Seed companies
    co1 = Company(name="Co 1", created_by=admin.user_id, is_verified=True)
    co2 = Company(name="Co 2", created_by=user.user_id, is_verified=False)
    db_session.add_all([co1, co2])
    db_session.commit()

    # Seed jobs with descriptions
    j1 = Job(title="Job 1", description="Description for job 1", company_id=co1.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open, created_by=admin.user_id)
    j2 = Job(title="Job 2", description="Description for job 2", company_id=co2.company_id, employment_type=EmploymentType.contract, status=JobStatus.closed, created_by=user.user_id)
    db_session.add_all([j1, j2])
    db_session.commit()

    # Seed application
    app = Application(job_id=j1.job_id, user_id=user.user_id, cover_letter="Letter", status=ApplicationStatus.offer_issued)
    db_session.add(app)
    db_session.commit()

    analytics = service.get_analytics()
    assert analytics["users"]["total"] == 2
    assert analytics["users"]["admins"] == 1
    assert analytics["companies"]["total"] == 2
    assert analytics["companies"]["verified"] == 1
    assert analytics["jobs"]["total"] == 2
    assert analytics["jobs"]["active"] == 1
    assert analytics["applications"]["total"] == 1
    assert analytics["applications"]["offers_issued"] == 1

def test_admin_service_list_and_update_jobs(db_session):
    service = AdminService(db_session)
    admin = User(name="Admin2", email="admin2@example.com", password="hash", is_admin=True)
    db_session.add(admin)
    db_session.commit()

    co = Company(name="Tech Firm", created_by=admin.user_id, is_verified=True)
    db_session.add(co)
    db_session.commit()

    job = Job(
        title="Lead Architect",
        description="Design distributed architectures",
        location="Chicago, IL",
        company_id=co.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=admin.user_id
    )
    db_session.add(job)
    db_session.commit()

    # List jobs
    jobs = service.list_jobs(query="Architect")
    assert len(jobs) == 1
    assert jobs[0].title == "Lead Architect"

    # Update job status
    updated = service.update_job_status(job.job_id, JobStatus.closed, admin_user_id=admin.user_id)
    assert updated.status == JobStatus.closed
    assert updated.updated_by == admin.user_id

    # Nonexistent job update raises JobNotFoundException
    with pytest.raises(JobNotFoundException):
        service.update_job_status(99999, JobStatus.closed, admin_user_id=admin.user_id)

def test_admin_service_cascade_soft_delete(db_session):
    service = AdminService(db_session)
    admin = User(name="Admin3", email="admin3@example.com", password="hash", is_admin=True)
    cand1 = User(name="Candidate 1", email="cand1@example.com", password="hash", is_admin=False)
    cand2 = User(name="Candidate 2", email="cand2@example.com", password="hash", is_admin=False)
    db_session.add_all([admin, cand1, cand2])
    db_session.commit()

    co = Company(name="Delete Co", created_by=admin.user_id, is_verified=True)
    db_session.add(co)
    db_session.commit()

    job = Job(
        title="Job to Delete",
        description="A job that will be deleted soon",
        company_id=co.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=admin.user_id
    )
    db_session.add(job)
    db_session.commit()

    app1 = Application(job_id=job.job_id, user_id=cand1.user_id, cover_letter="Letter 1", status=ApplicationStatus.pending)
    app2 = Application(job_id=job.job_id, user_id=cand2.user_id, cover_letter="Letter 2", status=ApplicationStatus.reviewed)
    db_session.add_all([app1, app2])
    db_session.commit()

    # Admin deletes job -> cascade soft delete to applications
    service.delete_job(job.job_id, admin_user_id=admin.user_id)

    db_session.refresh(job)
    db_session.refresh(app1)
    db_session.refresh(app2)

    assert job.deleted_at is not None
    assert app1.deleted_at is not None
    assert app2.deleted_at is not None
