from datetime import datetime, timezone, timedelta
from app.models.user import User
from app.models.company import Company
from app.models.job import Job, EmploymentType, JobStatus
from app.models.application import Application, ApplicationStatus
from app.models.skill import Skill
from app.models.refresh_token import RefreshToken

def test_user_model_attributes_and_relationships(db_session):
    user = User(
        name="Alice Developer",
        email="alice@example.com",
        password="hashedpassword123",
        bio="Full stack engineer",
        years_of_experience=4,
        is_admin=False,
    )
    skill = Skill(name="PostgreSQL")
    user.skills.append(skill)

    db_session.add_all([user, skill])
    db_session.commit()

    db_session.refresh(user)
    assert user.user_id is not None
    assert user.name == "Alice Developer"
    assert user.email == "alice@example.com"
    assert user.is_admin is False
    assert len(user.skills) == 1
    assert user.skills[0].name == "PostgreSQL"
    assert user.deleted_at is None

def test_company_model_defaults(db_session):
    user = User(name="Owner", email="owner@example.com", password="hash")
    db_session.add(user)
    db_session.commit()

    company = Company(
        name="Acme Corp",
        created_by=user.user_id,
        website="https://acme.org"
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)

    assert company.company_id is not None
    assert company.is_verified is False  # Must default to False
    assert company.created_at is not None

def test_job_model_enums_and_defaults(db_session):
    user = User(name="Recruiter", email="recruiter@example.com", password="hash")
    db_session.add(user)
    db_session.commit()

    company = Company(name="HiringCo", created_by=user.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        company_id=company.company_id,
        title="Backend Engineer",
        description="FastAPI role",
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=user.user_id
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    assert job.job_id is not None
    assert job.status == JobStatus.open
    assert job.employment_type == EmploymentType.full_time
    assert job.company.name == "HiringCo"

def test_application_model_defaults_and_dates(db_session):
    applicant = User(name="Candidate", email="cand@example.com", password="hash")
    db_session.add(applicant)
    db_session.commit()

    company = Company(name="AppCo", created_by=applicant.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        company_id=company.company_id,
        title="Tester",
        description="Testing role description",
        employment_type=EmploymentType.contract,
        created_by=applicant.user_id
    )
    db_session.add(job)
    db_session.commit()

    app = Application(
        job_id=job.job_id,
        user_id=applicant.user_id,
        cover_letter="My application letter",
        status=ApplicationStatus.pending,
    )
    db_session.add(app)
    db_session.commit()
    db_session.refresh(app)

    assert app.application_id is not None
    assert app.status == ApplicationStatus.pending
    assert app.offer_issued_at is None
    assert app.offer_expires_at is None

def test_refresh_token_model(db_session):
    user = User(name="TokenUser", email="token@example.com", password="hash")
    db_session.add(user)
    db_session.commit()

    token = RefreshToken(
        user_id=user.user_id,
        token_hash="sha256hashstring",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        revoked_at=None
    )
    db_session.add(token)
    db_session.commit()
    db_session.refresh(token)

    assert token.token_id is not None
    assert token.revoked_at is None
    assert token.user_id == user.user_id
