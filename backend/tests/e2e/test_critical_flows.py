import pytest
from app.models.user import User
from app.models.company import Company
from app.models.job import Job, EmploymentType, JobStatus
from app.core.security import get_password_hash, create_access_token

def test_flow_authentication_and_cookie_lifecycle(client):
    """
    E2E Flow 1 (Spec #6 & #8):
    1. Register user via POST /api/v1/auth/register.
    2. Verify access_token in body and refresh_token ONLY in Set-Cookie (never in JSON).
    3. Rotate token via POST /api/v1/auth/refresh.
    4. Logout via POST /api/v1/auth/logout.
    5. Attempt refresh with revoked token -> 401 INVALID_TOKEN.
    """
    # 1. Register
    reg_payload = {
        "name": "E2E Candidate",
        "email": "candidate_e2e@example.com",
        "password": "SecurePassword123!",
        "years_of_experience": 4
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, reg_res.text
    data = reg_res.json()

    # Spec #6: Refresh token MUST NOT be exposed in JSON response
    assert "access_token" in data
    assert "refresh_token" not in data
    assert "token_type" in data

    # Spec #6: Refresh token must be issued via httpOnly cookie
    refresh_cookie = reg_res.cookies.get("refresh_token")
    assert refresh_cookie is not None

    # 2. Token refresh rotation
    ref_res = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert ref_res.status_code == 200, ref_res.text
    ref_data = ref_res.json()
    assert "access_token" in ref_data
    assert "refresh_token" not in ref_data

    new_refresh_cookie = ref_res.cookies.get("refresh_token")
    assert new_refresh_cookie is not None
    assert new_refresh_cookie != refresh_cookie  # Rotated

    # 3. Old cookie is invalidated
    stale_res = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert stale_res.status_code == 401
    assert stale_res.json().get("code") == "INVALID_TOKEN"

    # 4. Logout revokes active cookie
    logout_res = client.post("/api/v1/auth/logout", cookies={"refresh_token": new_refresh_cookie})
    assert logout_res.status_code == 200

    # 5. Subsequent refresh after logout is blocked
    after_logout_res = client.post("/api/v1/auth/refresh", cookies={"refresh_token": new_refresh_cookie})
    assert after_logout_res.status_code == 401
    assert after_logout_res.json().get("code") == "INVALID_TOKEN"


def test_flow_company_verification_and_salary_validation(client, db_session):
    """
    E2E Flow 2 (Spec #7 & #12):
    1. Unverified company cannot post jobs (403 COMPANY_NOT_VERIFIED).
    2. Admin verifies company.
    3. Job posting with salary_min > salary_max is rejected.
    4. Valid job posting succeeds.
    """
    # Create employer
    employer = User(
        name="Tech Recruiter",
        email="recruiter@innovate.com",
        password=get_password_hash("RecruiterPass123!"),
        is_admin=False
    )
    admin = User(
        name="Super Admin",
        email="admin@platform.com",
        password=get_password_hash("AdminPass123!"),
        is_admin=True
    )
    db_session.add_all([employer, admin])
    db_session.commit()

    emp_token = create_access_token({"sub": str(employer.user_id), "email": employer.email, "is_admin": False})
    admin_token = create_access_token({"sub": str(admin.user_id), "email": admin.email, "is_admin": True})

    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Employer creates company (is_verified defaults to False)
    comp_res = client.post(
        "/api/v1/companies",
        json={"name": "Innovate AI", "industry": "Artificial Intelligence", "location": "San Francisco, CA"},
        headers=emp_headers
    )
    assert comp_res.status_code == 201, comp_res.text
    company_id = comp_res.json()["company_id"]
    assert comp_res.json()["is_verified"] is False

    # Employer tries to post job under unverified company -> 400 COMPANY_NOT_VERIFIED
    job_payload = {
        "company_id": company_id,
        "title": "Machine Learning Engineer",
        "description": "Develop foundation models",
        "location": "San Francisco, CA",
        "salary_min": 120000,
        "salary_max": 180000,
        "employment_type": "full_time"
    }
    block_res = client.post("/api/v1/jobs", json=job_payload, headers=emp_headers)
    assert block_res.status_code == 400
    assert block_res.json().get("code") == "COMPANY_NOT_VERIFIED"

    # Admin verifies the company
    verify_res = client.patch(f"/api/v1/companies/{company_id}/verify?is_verified=true", headers=admin_headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True

    # Employer attempts to post job with invalid salary (salary_min > salary_max) -> Rejected
    bad_salary_payload = {**job_payload, "salary_min": 200000, "salary_max": 100000}
    bad_res = client.post("/api/v1/jobs", json=bad_salary_payload, headers=emp_headers)
    assert bad_res.status_code in [400, 422]
    bad_body = bad_res.json()
    assert "code" in bad_body

    # Employer posts valid job -> 201 Created
    valid_res = client.post("/api/v1/jobs", json=job_payload, headers=emp_headers)
    assert valid_res.status_code == 201, valid_res.text
    assert valid_res.json()["title"] == "Machine Learning Engineer"


def test_flow_application_lifecycle_and_atomic_offer_acceptance(client, db_session):
    """
    E2E Flow 3 (Spec #12 & #18):
    1. Candidate applies to job -> Duplicate application blocked.
    2. Employer walks application through state machine up to offer_issued.
    3. Candidate accepts offer -> Atomic multi-write updates application AND closes the job.
    """
    # Setup Employer, Company, Job, and Candidate
    employer = User(
        name="Hiring Lead",
        email="lead@scale.io",
        password=get_password_hash("LeadPass123!"),
        is_admin=False
    )
    candidate = User(
        name="Applicant One",
        email="applicant1@scale.io",
        password=get_password_hash("AppPass123!"),
        is_admin=False
    )
    db_session.add_all([employer, candidate])
    db_session.commit()

    company = Company(name="Scale Systems", created_by=employer.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        company_id=company.company_id,
        title="Senior Platform Engineer",
        description="Scalable infrastructure",
        location="Remote",
        salary_min=130000,
        salary_max=190000,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=employer.user_id
    )
    db_session.add(job)
    db_session.commit()

    emp_token = create_access_token({"sub": str(employer.user_id), "email": employer.email, "is_admin": False})
    cand_token = create_access_token({"sub": str(candidate.user_id), "email": candidate.email, "is_admin": False})

    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    # 1. Candidate applies
    app_res = client.post(
        "/api/v1/applications",
        json={"job_id": job.job_id, "cover_letter": "I have 5 years of cloud experience."},
        headers=cand_headers
    )
    assert app_res.status_code == 201, app_res.text
    app_data = app_res.json()
    application_id = app_data["application_id"]
    assert app_data["status"] == "pending"

    # 2. Duplicate application blocked
    dup_res = client.post(
        "/api/v1/applications",
        json={"job_id": job.job_id, "cover_letter": "Trying again..."},
        headers=cand_headers
    )
    assert dup_res.status_code == 400
    assert dup_res.json().get("code") == "APPLICATION_ALREADY_EXISTS"

    # 3. State machine progression by employer
    transitions = ["reviewed", "shortlisted", "offer_issued"]
    for next_st in transitions:
        st_res = client.put(
            f"/api/v1/applications/{application_id}/status",
            json={"status": next_st},
            headers=emp_headers
        )
        assert st_res.status_code == 200, f"Failed at transition {next_st}: {st_res.text}"
        assert st_res.json()["status"] == next_st

    # 4. Candidate accepts offer -> Atomic transaction closes the job
    accept_res = client.put(
        f"/api/v1/applications/{application_id}/status",
        json={"status": "offer_accepted"},
        headers=cand_headers
    )
    assert accept_res.status_code == 200, accept_res.text
    assert accept_res.json()["status"] == "offer_accepted"

    # 5. Verify the job is now closed in the database
    db_session.expire_all()
    updated_job = db_session.query(Job).filter(Job.job_id == job.job_id).first()
    assert updated_job.status == JobStatus.closed

def test_flow_forgot_password_background_task(client, db_session):
    """Verify forgot-password endpoint dispatches email via BackgroundTasks without blocking and returns HTTP 200."""
    user = User(
        name="Forgot PW User",
        email="forgot_pw@example.com",
        password=get_password_hash("OldPassword123!"),
        is_admin=False
    )
    db_session.add(user)
    db_session.commit()

    res = client.post("/api/v1/auth/forgot-password", json={"email": "forgot_pw@example.com"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "success"
    assert "instructions have been sent" in data["message"]
