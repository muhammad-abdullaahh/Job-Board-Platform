import pytest
from pydantic import ValidationError
from app.schemas.auth_schema import (
    LoginRequest,
    UserRegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    validate_password_complexity,
)
from app.schemas.job_schema import (
    JobCreate,
    JobUpdate,
    AdminJobStatusUpdate,
)
from app.schemas.company_schema import (
    CompanyCreate,
    CompanyUpdate,
    CompanyRenameRequest,
)
from app.schemas.application_schema import (
    ApplicationCreate,
    ApplicationStatusUpdate,
)
from app.schemas.user_schema import (
    SkillCreate,
    UserUpdate,
    AdminRoleUpdate,
    DeleteAccountRequest,
)
from app.models.job import EmploymentType, JobStatus
from app.models.application import ApplicationStatus

# --- Auth Schemas ---
def test_password_complexity_valid():
    assert validate_password_complexity("StrongP@ss123") == "StrongP@ss123"

def test_password_complexity_too_short():
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_complexity("Short1A")

def test_password_complexity_missing_uppercase():
    with pytest.raises(ValueError, match="at least one uppercase"):
        validate_password_complexity("nouppercase123")

def test_password_complexity_missing_lowercase():
    with pytest.raises(ValueError, match="at least one lowercase"):
        validate_password_complexity("NOLOWERCASE123")

def test_password_complexity_missing_number():
    with pytest.raises(ValueError, match="at least one number"):
        validate_password_complexity("NoNumbersHere")

def test_user_register_request_validation():
    # Valid registration
    reg = UserRegisterRequest(
        name="  Jane Doe  ",
        email="  JANE.DOE@EXAMPLE.COM  ",
        password="ValidPassword123!",
        years_of_experience=5,
    )
    assert reg.name == "Jane Doe"
    assert reg.email == "jane.doe@example.com"
    assert reg.years_of_experience == 5

    # Empty name fails
    with pytest.raises(ValidationError):
        UserRegisterRequest(name="   ", email="test@example.com", password="ValidPassword123!")

    # Invalid email fails
    with pytest.raises(ValidationError):
        UserRegisterRequest(name="Jane", email="not-an-email", password="ValidPassword123!")

def test_login_request_normalizes_email():
    login = LoginRequest(email="  USER@TEST.COM  ", password="AnyPassword")
    assert login.email == "user@test.com"

# --- Job Schemas ---
def test_job_create_salary_bounds():
    # Valid bounds
    job = JobCreate(
        company_id=1,
        title="Software Engineer",
        salary_min=50000,
        salary_max=100000,
        employment_type=EmploymentType.full_time,
    )
    assert job.salary_min == 50000

    # Negative salary rejected
    with pytest.raises(ValidationError, match="cannot be negative"):
        JobCreate(
            company_id=1,
            title="Dev",
            salary_min=-100,
            salary_max=50000,
            employment_type=EmploymentType.full_time,
        )

    # min > max rejected
    with pytest.raises(ValidationError, match="cannot exceed maximum"):
        JobCreate(
            company_id=1,
            title="Dev",
            salary_min=120000,
            salary_max=80000,
            employment_type=EmploymentType.full_time,
        )

def test_job_update_salary_bounds():
    update = JobUpdate(salary_min=60000, salary_max=90000)
    assert update.salary_min == 60000

    with pytest.raises(ValidationError, match="cannot exceed maximum"):
        JobUpdate(salary_min=100000, salary_max=50000)

def test_admin_job_status_update():
    status_update = AdminJobStatusUpdate(status=JobStatus.closed)
    assert status_update.status == JobStatus.closed

# --- Company Schemas ---
def test_company_schemas():
    create = CompanyCreate(
        name="TechCorp",
        description="Top company",
        website="https://techcorp.com",
        location="San Francisco, CA"
    )
    assert create.name == "TechCorp"

    update = CompanyUpdate(name="TechCorp Updated")
    assert update.name == "TechCorp Updated"
    assert "is_verified" not in CompanyUpdate.model_fields

    rename = CompanyRenameRequest(name="Renamed Inc")
    assert rename.name == "Renamed Inc"

# --- Application Schemas ---
def test_application_schemas():
    app_in = ApplicationCreate(job_id=1, cover_letter="I am excited to apply.")
    assert app_in.job_id == 1
    assert "excited" in app_in.cover_letter

    status_in = ApplicationStatusUpdate(status=ApplicationStatus.shortlisted)
    assert status_in.status == ApplicationStatus.shortlisted

# --- User & Skill Schemas ---
def test_user_and_skill_schemas():
    skill = SkillCreate(name="Python")
    assert skill.name == "Python"

    user_update = UserUpdate(bio="Experienced Engineer", years_of_experience=7, skill_ids=[1, 2])
    assert user_update.years_of_experience == 7
    assert user_update.skill_ids == [1, 2]

    role_update = AdminRoleUpdate(is_admin=True)
    assert role_update.is_admin is True

    del_req = DeleteAccountRequest(password="SecretPass123!")
    assert del_req.password == "SecretPass123!"
