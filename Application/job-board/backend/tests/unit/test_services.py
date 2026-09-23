import pytest
from app.services.job_service import JobService
from app.services.application_service import ApplicationService
from app.services.auth_service import AuthService
from app.schemas.job_schema import JobCreate
from app.schemas.auth_schema import UserRegisterRequest, LoginRequest
from app.models.job import EmploymentType, JobStatus, Job
from app.models.company import Company
from app.models.user import User
from app.models.application import Application, ApplicationStatus
from app.exceptions import (
    InvalidSalaryRangeException,
    CompanyNotVerifiedException,
    NotCompanyOwnerException,
    InvalidStatusTransitionException,
    DuplicateApplicationException,
    InvalidCredentialsException,
    InvalidTokenException,
)

def test_job_service_salary_range_validation(db_session):
    """Spec #12: JobCreate schema and JobService must reject salary_min > salary_max."""
    # 1. Pydantic schema validation check
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        JobCreate(
            company_id=1,
            title="Software Engineer",
            description="Engineering role",
            salary_min=150000,
            salary_max=80000,  # Invalid: min > max
            employment_type=EmploymentType.full_time,
        )

    # 2. Service level validation check (defense in depth)
    valid_job = JobCreate(
        company_id=1,
        title="Software Engineer",
        description="Engineering role",
        salary_min=50000,
        salary_max=80000,
        employment_type=EmploymentType.full_time,
    )
    # Manually mutate to simulate bypass
    valid_job.salary_min = 150000
    service = JobService(db_session)
    with pytest.raises(InvalidSalaryRangeException):
        service.create_job(valid_job, user_id=1)

def test_job_service_unverified_company_rejected(db_session):
    """Spec #7: Unverified companies cannot post job listings."""
    # Create user
    user = User(name="Recruiter", email="recruiter@example.com", password="hashedpassword", is_admin=False)
    db_session.add(user)
    db_session.commit()

    # Create unverified company
    company = Company(name="StartUp Inc", created_by=user.user_id, is_verified=False)
    db_session.add(company)
    db_session.commit()

    service = JobService(db_session)
    job_in = JobCreate(
        company_id=company.company_id,
        title="Frontend Dev",
        salary_min=50000,
        salary_max=90000,
        employment_type=EmploymentType.full_time,
    )
    with pytest.raises(CompanyNotVerifiedException):
        service.create_job(job_in, user_id=user.user_id)

def test_job_service_company_ownership_enforced(db_session):
    """Spec #7: Users cannot post jobs under companies they do not own."""
    user1 = User(name="Owner", email="owner@example.com", password="hashedpassword", is_admin=False)
    user2 = User(name="Intruder", email="intruder@example.com", password="hashedpassword", is_admin=False)
    db_session.add_all([user1, user2])
    db_session.commit()

    company = Company(name="Enterprise Co", created_by=user1.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    service = JobService(db_session)
    job_in = JobCreate(
        company_id=company.company_id,
        title="Backend Dev",
        salary_min=60000,
        salary_max=100000,
        employment_type=EmploymentType.full_time,
    )
    with pytest.raises(NotCompanyOwnerException):
        service.create_job(job_in, user_id=user2.user_id)

def test_application_service_invalid_status_transition(db_session):
    """Spec #12: Application state machine blocks invalid jumps (e.g. pending -> hired)."""
    user = User(name="Applicant", email="applicant@example.com", password="hashedpassword", is_admin=False)
    employer = User(name="Boss", email="boss@example.com", password="hashedpassword", is_admin=False)
    db_session.add_all([user, employer])
    db_session.commit()

    company = Company(name="TechCorp", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(title="Dev", description="A great role", company_id=company.company_id, employment_type=EmploymentType.full_time, created_by=employer.user_id)
    db_session.add(job)
    db_session.commit()

    app_record = Application(job_id=job.job_id, user_id=user.user_id, cover_letter="Hi", status=ApplicationStatus.pending)
    db_session.add(app_record)
    db_session.commit()

    service = ApplicationService(db_session)
    # Trying to jump directly from pending to hired must be rejected
    with pytest.raises(InvalidStatusTransitionException):
        service.update_application_status(
            application_id=app_record.application_id,
            new_status=ApplicationStatus.hired,
            updater_user_id=employer.user_id
        )

def test_auth_service_db_refresh_token_lifecycle(db_session):
    """Spec #6: Refresh tokens stored in DB and revocable on logout."""
    auth_service = AuthService(db_session)

    # Register user
    reg_in = UserRegisterRequest(
        name="John Doe",
        email="john.doe@example.com",
        password="StrongPassword123!",
        years_of_experience=3
    )
    token, raw_refresh = auth_service.register_user(reg_in)
    assert token.access_token is not None
    assert raw_refresh is not None

    # Refresh access token
    new_token, new_raw_refresh = auth_service.refresh_access_token(raw_refresh)
    assert new_token.access_token is not None
    assert new_raw_refresh != raw_refresh  # Token rotated

    # Old refresh token is now invalid/revoked
    with pytest.raises(InvalidTokenException):
        auth_service.refresh_access_token(raw_refresh)

    # Logout revokes the new refresh token
    assert auth_service.logout(new_raw_refresh) is True

    # After logout, token cannot be used again
    with pytest.raises(InvalidTokenException):
        auth_service.refresh_access_token(new_raw_refresh)

def test_application_service_duplicate_application_integrity_error(db_session, monkeypatch):
    """Verify apply_to_job catches IntegrityError from database race condition and cleanly raises DuplicateApplicationException."""
    from sqlalchemy.exc import IntegrityError
    from app.schemas.application_schema import ApplicationCreate

    user = User(name="Candidate", email="candidate_race@example.com", password="hash", is_admin=False)
    db_session.add(user)
    db_session.commit()

    company = Company(name="Test Co", created_by=user.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        title="Software Engineer",
        description="Dev role",
        company_id=company.company_id,
        status=JobStatus.open,
        created_by=user.user_id
    )
    db_session.add(job)
    db_session.commit()

    app_service = ApplicationService(db_session)
    app_in = ApplicationCreate(job_id=job.job_id, cover_letter="Hello!")

    # Simulate database unique constraint race condition by forcing repo.create to raise IntegrityError
    def mock_create(*args, **kwargs):
        raise IntegrityError("mock unique violation", orig=Exception("duplicate key"), params={})

    monkeypatch.setattr(app_service.app_repo, "create", mock_create)

    with pytest.raises(DuplicateApplicationException):
        app_service.apply_to_job(user.user_id, app_in)

def test_skill_repository_rollback_on_duplicate(db_session):
    """Verify SkillRepository rolls back on duplicate skill name so session remains valid."""
    from app.repositories.skill_repository import SkillRepository
    from sqlalchemy.exc import IntegrityError

    repo = SkillRepository(db_session)
    skill1 = repo.create("Python")
    assert skill1.name == "Python"

    # Creating duplicate skill should fail and roll back
    with pytest.raises(IntegrityError):
        repo.create("Python")

    # Verify session is still completely healthy and can execute queries
    skills = repo.get_all()
    assert len(skills) == 1
    assert skills[0].name == "Python"
