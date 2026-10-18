from datetime import datetime, timezone
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


def test_job_service_public_visibility_unowned_and_owner_states(db_session):
    service = JobService(db_session)
    active_owner = User(name="ActiveOwner", email="act@example.com", password="hash", is_active=True)
    locked_owner = User(name="LockedOwner", email="lock@example.com", password="hash", is_active=False)
    deleted_owner = User(name="DeletedOwner", email="del@example.com", password="hash", is_active=True, deleted_at=datetime.now(timezone.utc))
    db_session.add_all([active_owner, locked_owner, deleted_owner])
    db_session.commit()

    # 1. Verified company with NO owner
    co_no_owner = Company(name="Unowned Co", created_by=None, updated_by=None, is_verified=True)
    # 2. Verified company with locked owner
    co_locked = Company(name="Locked Co", created_by=locked_owner.user_id, is_verified=True)
    # 3. Verified company with soft-deleted owner
    co_deleted = Company(name="Deleted Co", created_by=deleted_owner.user_id, is_verified=True)
    # 4. Unverified company with active owner
    co_unverified = Company(name="Unverified Co", created_by=active_owner.user_id, is_verified=False)

    db_session.add_all([co_no_owner, co_locked, co_deleted, co_unverified])
    db_session.commit()

    j_no_owner = Job(title="Unowned Job", description="Description", company_id=co_no_owner.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open)
    j_locked = Job(title="Locked Job", description="Description", company_id=co_locked.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open)
    j_deleted = Job(title="Deleted Owner Job", description="Description", company_id=co_deleted.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open)
    j_unverified = Job(title="Unverified Co Job", description="Description", company_id=co_unverified.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open)

    db_session.add_all([j_no_owner, j_locked, j_deleted, j_unverified])
    db_session.commit()

    # Public list & search
    visible_jobs = service.list_jobs()
    visible_ids = [j.job_id for j in visible_jobs]
    assert j_no_owner.job_id in visible_ids
    assert j_locked.job_id not in visible_ids
    assert j_deleted.job_id not in visible_ids
    assert j_unverified.job_id not in visible_ids

    # Search by query
    searched = service.list_jobs(query="Unowned")
    assert any(j.job_id == j_no_owner.job_id for j in searched)

    # Public detail
    job = service.get_job(j_no_owner.job_id)
    assert job.job_id == j_no_owner.job_id

    with pytest.raises(JobNotFoundException):
        service.get_job(j_locked.job_id)

    with pytest.raises(JobNotFoundException):
        service.get_job(j_deleted.job_id)

    with pytest.raises(JobNotFoundException):
        service.get_job(j_unverified.job_id)

