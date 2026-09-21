from datetime import datetime, timedelta, timezone
import pytest
from app.models.user import User
from app.models.skill import Skill
from app.models.company import Company
from app.models.job import Job, EmploymentType, JobStatus
from app.models.application import Application, ApplicationStatus
from app.repositories.job_repository import JobRepository
from app.repositories.user_repository import UserRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.application_repository import ApplicationRepository
from app.core.security import hash_token

def test_job_repository_raw_sql_search_and_sorting(db_session):
    """Spec #10: Raw SQL parameterized search across title, description, location, salary, sort."""
    employer = User(name="Employer", email="emp@example.com", password="hash", is_admin=False)
    db_session.add(employer)
    db_session.commit()

    company = Company(name="TestCorp", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job1 = Job(
        title="Senior Python Backend Engineer",
        description="Build scalable APIs with FastAPI and PostgreSQL",
        location="Remote",
        salary_min=100000,
        salary_max=150000,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        company_id=company.company_id,
        created_by=employer.user_id,
    )
    job2 = Job(
        title="Frontend React Developer",
        description="Develop modern web UI using React and Tailwind",
        location="New York, NY",
        salary_min=80000,
        salary_max=120000,
        employment_type=EmploymentType.contract,
        status=JobStatus.open,
        company_id=company.company_id,
        created_by=employer.user_id,
    )
    job3 = Job(
        title="DevOps Cloud Specialist",
        description="Kubernetes, Terraform and AWS infrastructure",
        location="Remote",
        salary_min=110000,
        salary_max=170000,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        company_id=company.company_id,
        created_by=employer.user_id,
    )
    db_session.add_all([job1, job2, job3])
    db_session.commit()

    job_repo = JobRepository(db_session)

    # 1. Search by keyword
    py_results = job_repo.search_jobs(query="Python")
    assert len(py_results) == 1
    assert py_results[0].title == "Senior Python Backend Engineer"

    # 2. Search by location
    remote_results = job_repo.search_jobs(location="Remote")
    assert len(remote_results) == 2
    assert all(j.location == "Remote" for j in remote_results)

    # 3. Filter by employment_type
    contract_results = job_repo.search_jobs(employment_type=EmploymentType.contract)
    assert len(contract_results) == 1
    assert contract_results[0].job_id == job2.job_id

    # 4. Filter by min_salary (salary_max >= 160000)
    high_sal_results = job_repo.search_jobs(min_salary=160000)
    assert len(high_sal_results) == 1
    assert high_sal_results[0].job_id == job3.job_id

    # 5. Sorting by salary_max descending
    sorted_results = job_repo.search_jobs(sort="-salary_max")
    assert len(sorted_results) == 3
    assert sorted_results[0].salary_max == 170000
    assert sorted_results[1].salary_max == 150000
    assert sorted_results[2].salary_max == 120000

    # 6. Pagination (skip=1, limit=1)
    page_results = job_repo.search_jobs(sort="-salary_max", skip=1, limit=1)
    assert len(page_results) == 1
    assert page_results[0].salary_max == 150000

def test_user_repository_candidate_skill_search(db_session):
    """Spec #10: Search job seekers matching specific technical skills using parameterized Raw SQL."""
    # Create skills
    skill_py = Skill(name="Python")
    skill_docker = Skill(name="Docker")
    db_session.add_all([skill_py, skill_docker])
    db_session.commit()

    # Create job seekers
    seeker1 = User(
        name="Alice PyDev",
        email="alice@dev.com",
        password="hash",
        years_experience=5,
        is_admin=False
    )
    seeker2 = User(
        name="Bob Ops",
        email="bob@ops.com",
        password="hash",
        years_experience=2,
        is_admin=False
    )
    db_session.add_all([seeker1, seeker2])
    db_session.commit()

    seeker1.skills.append(skill_py)
    seeker2.skills.append(skill_docker)
    db_session.commit()

    user_repo = UserRepository(db_session)

    # Search by Python skill
    py_seekers = user_repo.search_job_seekers_by_skills(skill_ids=[skill_py.skill_id])
    assert len(py_seekers) == 1
    assert py_seekers[0].user_id == seeker1.user_id

    # Search by Docker skill
    docker_seekers = user_repo.search_job_seekers_by_skills(skill_ids=[skill_docker.skill_id])
    assert len(docker_seekers) == 1
    assert docker_seekers[0].user_id == seeker2.user_id

    # Search with min_experience filter
    exp_seekers = user_repo.search_job_seekers_by_skills(skill_ids=[], min_experience=4)
    assert len(exp_seekers) == 1
    assert exp_seekers[0].user_id == seeker1.user_id

def test_refresh_token_repository(db_session):
    """Spec #6: Database-backed refresh token storage, retrieval, and revocation."""
    user = User(name="TokenUser", email="token@example.com", password="hash", is_admin=False)
    db_session.add(user)
    db_session.commit()

    token_repo = RefreshTokenRepository(db_session)
    raw_token = "secure_random_refresh_token_string_12345"
    token_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    # 1. Create token
    created = token_repo.create(
        user_id=user.user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    assert created.user_id == user.user_id
    assert created.revoked_at is None

    # 2. Retrieve active token by hash
    retrieved = token_repo.get_active_by_hash(token_hash)
    assert retrieved is not None
    assert retrieved.token_id == created.token_id

    # 3. Revoke token
    revoked = token_repo.revoke_by_hash(token_hash)
    assert revoked is True

    # 4. Inactive after revocation
    after_revoke = token_repo.get_active_by_hash(token_hash)
    assert after_revoke is None

def test_application_repository_queries(db_session):
    """Spec #12: Application queries and filtering by status."""
    applicant = User(name="ApplicantUser", email="applicant2@example.com", password="hash", is_admin=False)
    employer = User(name="EmployerUser", email="emp2@example.com", password="hash", is_admin=False)
    db_session.add_all([applicant, employer])
    db_session.commit()

    company = Company(name="AppTestCorp", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        title="QA Automation Engineer",
        description="Writing integration and E2E tests",
        company_id=company.company_id,
        employment_type=EmploymentType.full_time,
        created_by=employer.user_id,
    )
    db_session.add(job)
    db_session.commit()

    app_repo = ApplicationRepository(db_session)
    app1 = Application(job_id=job.job_id, user_id=applicant.user_id, cover_letter="Cover letter 1", status=ApplicationStatus.pending)
    db_session.add(app1)
    db_session.commit()

    # Filter by job and status
    pending_apps = app_repo.get_job_applications(job_id=job.job_id, status=ApplicationStatus.pending)
    assert len(pending_apps) == 1
    assert pending_apps[0].application_id == app1.application_id

    # Filter by user
    user_apps = app_repo.get_user_applications(user_id=applicant.user_id)
    assert len(user_apps) == 1
    assert user_apps[0].job_id == job.job_id
