from datetime import datetime, timezone, timedelta
from app.repositories.user_repository import UserRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.job_repository import JobRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.skill_repository import SkillRepository
from app.schemas.auth_schema import UserRegisterRequest
from app.schemas.user_schema import UserUpdate
from app.schemas.company_schema import CompanyCreate, CompanyUpdate
from app.schemas.job_schema import JobCreate, JobUpdate
from app.schemas.application_schema import ApplicationCreate
from app.models.job import EmploymentType, JobStatus
from app.models.application import ApplicationStatus

def test_user_repository_crud(db_session):
    repo = UserRepository(db_session)
    reg_in = UserRegisterRequest(
        name="Unit Repo User",
        email="repo_user@example.com",
        password="RepoPassword123!",
        bio="Test bio",
        years_of_experience=2
    )

    # 1. Create
    user = repo.create_user(reg_in)
    assert user.user_id is not None
    assert user.email == "repo_user@example.com"

    # 2. Get by email (case-insensitive)
    found_email = repo.get_user_by_email("  REPO_USER@EXAMPLE.COM  ")
    assert found_email is not None
    assert found_email.user_id == user.user_id

    # 3. Get by ID
    found_id = repo.get_user_by_id(user.user_id)
    assert found_id is not None
    assert found_id.email == "repo_user@example.com"

    # 4. Update
    repo.update_user(user, UserUpdate(bio="Updated bio", years_of_experience=4))
    db_session.refresh(user)
    assert user.bio == "Updated bio"
    assert user.years_of_experience == 4

    # 5. Soft delete and restore
    repo.soft_delete_user(user, deleted_by_user_id=user.user_id)
    db_session.refresh(user)
    assert user.deleted_at is not None
    assert repo.get_user_by_email("repo_user@example.com", include_deleted=False) is None
    assert repo.get_user_by_email("repo_user@example.com", include_deleted=True) is not None

    repo.restore_user(user)
    db_session.refresh(user)
    assert user.deleted_at is None

def test_company_repository_crud(db_session):
    user_repo = UserRepository(db_session)
    comp_repo = CompanyRepository(db_session)

    user = user_repo.create_user(UserRegisterRequest(
        name="Co Creator",
        email="creator@example.com",
        password="Password123!"
    ))

    # 1. Create
    co_in = CompanyCreate(name="Repository Ventures", website="https://repoventures.com", location="Seattle, WA")
    company = comp_repo.create(co_in, created_by_user_id=user.user_id)
    assert company.company_id is not None
    assert company.name == "Repository Ventures"

    # 2. Get by ID & Get by owner
    assert comp_repo.get_by_id(company.company_id) is not None
    assert comp_repo.get_by_owner(user.user_id) is not None

    # 3. Update & Rename
    comp_repo.update(company, CompanyUpdate(description="Top VC"), updater_user_id=user.user_id)
    assert company.description == "Top VC"

    comp_repo.rename(company, "Renamed Repo Ventures", updated_by_user_id=user.user_id)
    assert company.name == "Renamed Repo Ventures"

    # 4. Soft delete
    comp_repo.soft_delete(company, deleted_by_user_id=user.user_id)
    assert comp_repo.get_by_id(company.company_id) is None

def test_job_and_application_repository_crud(db_session):
    user_repo = UserRepository(db_session)
    comp_repo = CompanyRepository(db_session)
    job_repo = JobRepository(db_session)
    app_repo = ApplicationRepository(db_session)

    recruiter = user_repo.create_user(UserRegisterRequest(name="Rec", email="rec@example.com", password="Password123!"))
    applicant = user_repo.create_user(UserRegisterRequest(name="App", email="app@example.com", password="Password123!"))

    company = comp_repo.create(CompanyCreate(name="JobCo"), created_by_user_id=recruiter.user_id)

    # 1. Create Job
    job_in = JobCreate(
        company_id=company.company_id,
        title="Software Engineer",
        description="Coding role",
        employment_type=EmploymentType.full_time,
        salary_min=70000,
        salary_max=110000
    )
    job = job_repo.create(job_in, user_id=recruiter.user_id)
    assert job.job_id is not None

    # 2. Update Job
    job_repo.update(job, JobUpdate(title="Senior Software Engineer"), user_id=recruiter.user_id)
    assert job.title == "Senior Software Engineer"

    # 3. Create Application
    app_in = ApplicationCreate(job_id=job.job_id, cover_letter="I am very qualified.")
    app = app_repo.create(applicant.user_id, app_in)
    assert app.application_id is not None
    assert app.status == ApplicationStatus.pending

    # 4. Get application for user and job
    existing_app = app_repo.get_user_application_for_job(applicant.user_id, job.job_id)
    assert existing_app is not None
    assert existing_app.application_id == app.application_id

    # 5. Update Status
    app_repo.update_status(app, ApplicationStatus.reviewed, updater_user_id=recruiter.user_id)
    assert app.status == ApplicationStatus.reviewed

    # 6. Soft delete Job
    job_repo.soft_delete(job, deleted_by_user_id=recruiter.user_id)
    assert job_repo.get_by_id(job.job_id) is None

def test_refresh_token_repository(db_session):
    repo = RefreshTokenRepository(db_session)
    now = datetime.now(timezone.utc)

    # 1. Create
    token = repo.create(user_id=1, token_hash="test_sha_hash", expires_at=now + timedelta(days=1))
    assert token.token_id is not None

    # 2. Get active by hash
    active = repo.get_active_by_hash("test_sha_hash")
    assert active is not None
    assert active.token_id == token.token_id

    # 3. Revoke by hash
    assert repo.revoke_by_hash("test_sha_hash") is True
    assert repo.get_active_by_hash("test_sha_hash") is None

    # 4. Revoke all for user
    repo.create(user_id=2, token_hash="hash_user2_1", expires_at=now + timedelta(days=1))
    repo.create(user_id=2, token_hash="hash_user2_2", expires_at=now + timedelta(days=1))
    count = repo.revoke_all_for_user(2)
    assert count == 2

def test_skill_repository_crud(db_session):
    repo = SkillRepository(db_session)

    # 1. Create
    skill = repo.create("TypeScript", created_by_user_id=1)
    assert skill.skill_id is not None
    assert skill.name == "TypeScript"

    # 2. Get by name (case-insensitive)
    found = repo.get_by_name("typescript")
    assert found is not None
    assert found.skill_id == skill.skill_id

    # 3. Update
    repo.update(skill, "TypeScript v5")
    assert skill.name == "TypeScript v5"

    # 4. Delete
    repo.delete(skill)
    assert repo.get_by_id(skill.skill_id) is None
