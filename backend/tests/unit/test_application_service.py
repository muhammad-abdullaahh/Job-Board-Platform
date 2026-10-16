import pytest
from app.services.application_service import ApplicationService
from app.schemas.application_schema import ApplicationCreate
from app.models.job import Job, EmploymentType, JobStatus
from app.models.company import Company
from app.models.user import User
from app.models.application import Application, ApplicationStatus
from app.exceptions import (
    ApplicationNotFoundException,
    DuplicateApplicationException,
    JobNotFoundException,
    JobNotOpenException,
    InvalidStatusTransitionException,
    ForbiddenException,
)

def test_application_service_apply_validations(db_session):
    service = ApplicationService(db_session)
    candidate = User(name="Candidate", email="cand@example.com", password="hash")
    employer = User(name="Employer", email="emp@example.com", password="hash")
    db_session.add_all([candidate, employer])
    db_session.commit()

    company = Company(name="AppCo", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    # Closed job
    closed_job = Job(
        title="Closed Role",
        description="Role description",
        company_id=company.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.closed,
        created_by=employer.user_id
    )
    # Open job
    open_job = Job(
        title="Open Role",
        description="Role description",
        company_id=company.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=employer.user_id
    )
    db_session.add_all([closed_job, open_job])
    db_session.commit()

    # 1. Non-existent job
    with pytest.raises(JobNotFoundException):
        service.apply_to_job(candidate.user_id, ApplicationCreate(job_id=99999, cover_letter="Letter"))

    # 2. Closed job
    with pytest.raises(JobNotOpenException):
        service.apply_to_job(candidate.user_id, ApplicationCreate(job_id=closed_job.job_id, cover_letter="Letter"))

    # 3. Valid application
    app_record = service.apply_to_job(candidate.user_id, ApplicationCreate(job_id=open_job.job_id, cover_letter="Letter"))
    assert app_record.application_id is not None
    assert app_record.status == ApplicationStatus.pending

    # 4. Duplicate application
    with pytest.raises(DuplicateApplicationException):
        service.apply_to_job(candidate.user_id, ApplicationCreate(job_id=open_job.job_id, cover_letter="Second Letter"))

def test_application_service_get_and_review_permissions(db_session):
    service = ApplicationService(db_session)
    candidate = User(name="Candidate2", email="cand2@example.com", password="hash")
    employer = User(name="Employer2", email="emp2@example.com", password="hash")
    stranger = User(name="Stranger", email="stranger@example.com", password="hash")
    db_session.add_all([candidate, employer, stranger])
    db_session.commit()

    company = Company(name="PermCo", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        title="Role 2",
        description="Role 2 description",
        company_id=company.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=employer.user_id
    )
    db_session.add(job)
    db_session.commit()

    app_record = service.apply_to_job(candidate.user_id, ApplicationCreate(job_id=job.job_id, cover_letter="Letter"))

    # Candidate lists their own applications
    my_apps = service.get_my_applications(candidate.user_id)
    assert len(my_apps) == 1
    assert my_apps[0].application_id == app_record.application_id

    # Stranger cannot view employer applicant pipeline
    with pytest.raises(ForbiddenException):
        service.get_job_applications(job.job_id, requesting_user_id=stranger.user_id)

    # Employer can view applicant pipeline
    job_apps = service.get_job_applications(job.job_id, requesting_user_id=employer.user_id)
    assert len(job_apps) == 1

def test_application_service_status_transition_workflow(db_session):
    service = ApplicationService(db_session)
    candidate = User(name="Candidate3", email="cand3@example.com", password="hash")
    employer = User(name="Employer3", email="emp3@example.com", password="hash")
    db_session.add_all([candidate, employer])
    db_session.commit()

    company = Company(name="WorkflowCo", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        title="Role 3",
        description="Role 3 description",
        company_id=company.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=employer.user_id
    )
    db_session.add(job)
    db_session.commit()

    app_record = service.apply_to_job(candidate.user_id, ApplicationCreate(job_id=job.job_id, cover_letter="Letter"))

    # Step 1: Employer advances Pending -> Reviewed
    service.update_application_status(app_record.application_id, ApplicationStatus.reviewed, updater_user_id=employer.user_id)
    db_session.refresh(app_record)
    assert app_record.status == ApplicationStatus.reviewed

    # Step 2: Employer advances Reviewed -> Shortlisted
    service.update_application_status(app_record.application_id, ApplicationStatus.shortlisted, updater_user_id=employer.user_id)
    db_session.refresh(app_record)
    assert app_record.status == ApplicationStatus.shortlisted

    # Step 3: Employer issues offer -> Offer Issued
    service.update_application_status(app_record.application_id, ApplicationStatus.offer_issued, updater_user_id=employer.user_id)
    db_session.refresh(app_record)
    assert app_record.status == ApplicationStatus.offer_issued
    assert app_record.offer_issued_at is not None
    assert app_record.offer_expires_at is not None

    # Employer cannot accept offer on candidate's behalf
    with pytest.raises(ForbiddenException):
        service.update_application_status(app_record.application_id, ApplicationStatus.offer_accepted, updater_user_id=employer.user_id)

    # Candidate accepts offer -> Offer Accepted
    service.update_application_status(app_record.application_id, ApplicationStatus.offer_accepted, updater_user_id=candidate.user_id)
    db_session.refresh(app_record)
    assert app_record.status == ApplicationStatus.offer_accepted

    # Job is now automatically closed
    db_session.refresh(job)
    assert job.status == JobStatus.closed
