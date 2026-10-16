import pytest
from app.services.job_service import JobService
from app.schemas.job_schema import JobCreate, JobUpdate
from app.models.job import Job, EmploymentType, JobStatus
from app.models.company import Company
from app.models.user import User
from app.exceptions import (
    JobNotFoundException,
    CompanyNotFoundException,
    CompanyNotVerifiedException,
    NotCompanyOwnerException,
    InvalidSalaryRangeException,
    ForbiddenException,
)

def test_job_service_get_job(db_session):
    service = JobService(db_session)
    # Non-existent job raises JobNotFoundException
    with pytest.raises(JobNotFoundException):
        service.get_job(99999)

def test_job_service_create_job_validations(db_session):
    service = JobService(db_session)
    owner = User(name="Owner", email="owner@example.com", password="hash")
    intruder = User(name="Intruder", email="intruder@example.com", password="hash")
    admin = User(name="Admin", email="admin@example.com", password="hash", is_admin=True)
    db_session.add_all([owner, intruder, admin])
    db_session.commit()

    # Company not found
    job_in = JobCreate(
        company_id=9999,
        title="Test Job",
        description="Engineering role",
        salary_min=50000,
        salary_max=80000,
        employment_type=EmploymentType.full_time,
    )
    with pytest.raises(CompanyNotFoundException):
        service.create_job(job_in, user_id=owner.user_id)

    # Unverified company
    unverified_co = Company(name="Unverified Co", created_by=owner.user_id, is_verified=False)
    db_session.add(unverified_co)
    db_session.commit()

    job_in.company_id = unverified_co.company_id
    with pytest.raises(CompanyNotVerifiedException):
        service.create_job(job_in, user_id=owner.user_id)

    # Intruder trying to post to verified company
    verified_co = Company(name="Verified Co", created_by=owner.user_id, is_verified=True)
    db_session.add(verified_co)
    db_session.commit()

    job_in.company_id = verified_co.company_id
    with pytest.raises(NotCompanyOwnerException):
        service.create_job(job_in, user_id=intruder.user_id)

    # Owner posting valid job
    created = service.create_job(job_in, user_id=owner.user_id)
    assert created.job_id is not None
    assert created.title == "Test Job"

    # Admin posting job to any company
    admin_job_in = JobCreate(
        company_id=verified_co.company_id,
        title="Admin Job",
        description="Admin posted role",
        salary_min=70000,
        salary_max=90000,
        employment_type=EmploymentType.contract,
    )
    admin_created = service.create_job(admin_job_in, user_id=admin.user_id)
    assert admin_created.title == "Admin Job"

def test_job_service_update_and_delete(db_session):
    service = JobService(db_session)
    owner = User(name="Owner2", email="owner2@example.com", password="hash")
    other = User(name="Other2", email="other2@example.com", password="hash")
    db_session.add_all([owner, other])
    db_session.commit()

    company = Company(name="Verified Co 2", created_by=owner.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job_in = JobCreate(
        company_id=company.company_id,
        title="Initial Title",
        description="Initial description",
        salary_min=60000,
        salary_max=100000,
        employment_type=EmploymentType.full_time,
    )
    job = service.create_job(job_in, user_id=owner.user_id)

    # Unauthorized update by other user
    update_in = JobUpdate(title="Hacked Title")
    with pytest.raises(ForbiddenException):
        service.update_job(job.job_id, update_in, user_id=other.user_id)

    # Authorized update
    updated = service.update_job(job.job_id, update_in, user_id=owner.user_id)
    assert updated.title == "Hacked Title"

    # Unauthorized delete
    with pytest.raises(ForbiddenException):
        service.delete_job(job.job_id, deleted_by_user_id=other.user_id)

    # Authorized delete
    deleted = service.delete_job(job.job_id, deleted_by_user_id=owner.user_id)
    assert deleted.deleted_at is not None

def test_job_service_list_jobs(db_session):
    service = JobService(db_session)
    owner = User(name="Owner3", email="owner3@example.com", password="hash")
    db_session.add(owner)
    db_session.commit()

    company = Company(name="Search Co", created_by=owner.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    for i in range(3):
        job = Job(
            title=f"Position {i}",
            description=f"Description {i}",
            company_id=company.company_id,
            employment_type=EmploymentType.full_time,
            status=JobStatus.open,
            created_by=owner.user_id
        )
        db_session.add(job)
    db_session.commit()

    jobs = service.list_jobs(company_id=company.company_id)
    assert len(jobs) == 3
