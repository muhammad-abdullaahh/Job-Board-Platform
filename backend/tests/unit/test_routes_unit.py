from app.models.user import User
from app.models.company import Company
from app.models.job import Job, EmploymentType, JobStatus
from app.core.security import get_password_hash, create_access_token

def test_route_auth_endpoints(client):
    # Register
    res = client.post("/api/v1/auth/register", json={
        "name": "Route Test User",
        "email": "route_user@example.com",
        "password": "Password123!",
        "years_of_experience": 2
    })
    assert res.status_code == 201
    assert "access_token" in res.json()
    assert "refresh_token" in res.cookies

    # Duplicate register
    res_dup = client.post("/api/v1/auth/register", json={
        "name": "Route Test User",
        "email": "route_user@example.com",
        "password": "Password123!",
    })
    assert res_dup.status_code == 409 or res_dup.status_code == 400

    # Login
    res_login = client.post("/api/v1/auth/login", json={
        "email": "route_user@example.com",
        "password": "Password123!"
    })
    assert res_login.status_code == 200

    # Forgot password
    res_forgot = client.post("/api/v1/auth/forgot-password", json={
        "email": "route_user@example.com"
    })
    assert res_forgot.status_code == 200

    # Logout
    res_logout = client.post("/api/v1/auth/logout")
    assert res_logout.status_code == 200

def test_route_jobs_public_endpoints(client, db_session):
    # Seed a job
    user = User(name="Rec", email="rec_route@example.com", password="hash")
    db_session.add(user)
    db_session.commit()

    company = Company(name="RouteCo", created_by=user.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    job = Job(
        title="Public Job",
        description="Public role description",
        company_id=company.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=user.user_id
    )
    db_session.add(job)
    db_session.commit()

    # List jobs
    res = client.get("/api/v1/jobs")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    # Get job by ID
    res_get = client.get(f"/api/v1/jobs/{job.job_id}")
    assert res_get.status_code == 200
    assert res_get.json()["title"] == "Public Job"

    # Get nonexistent job -> 404
    res_404 = client.get("/api/v1/jobs/99999")
    assert res_404.status_code == 404

def test_route_companies_public_endpoints(client, db_session):
    user = User(name="Founder", email="founder_route@example.com", password="hash")
    db_session.add(user)
    db_session.commit()

    company = Company(name="PublicCo", created_by=user.user_id, is_verified=True)
    db_session.add(company)
    db_session.commit()

    # List companies
    res = client.get("/api/v1/companies")
    assert res.status_code == 200

    # Get company by ID
    res_co = client.get(f"/api/v1/companies/{company.company_id}")
    assert res_co.status_code == 200
    assert res_co.json()["name"] == "PublicCo"

    # Nonexistent company -> 404
    res_co_404 = client.get("/api/v1/companies/99999")
    assert res_co_404.status_code == 404

def test_route_users_and_admin_security_guards(client, db_session):
    # Unauthenticated profile access -> 401
    res_unauth = client.get("/api/v1/users/me")
    assert res_unauth.status_code == 401

    # Normal user accessing admin analytics -> 403
    norm_user = User(name="Norm", email="norm@example.com", password=get_password_hash("pass"), is_admin=False)
    admin_user = User(name="Admin", email="admin_rt@example.com", password=get_password_hash("pass"), is_admin=True)
    db_session.add_all([norm_user, admin_user])
    db_session.commit()

    user_token = create_access_token({"sub": str(norm_user.user_id), "role": "user", "email": norm_user.email})
    admin_token = create_access_token({"sub": str(admin_user.user_id), "role": "admin", "email": admin_user.email})

    res_user_admin = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {user_token}"})
    assert res_user_admin.status_code == 403

    # Admin accessing analytics -> 200
    res_admin_ok = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_ok.status_code == 200
    assert "users" in res_admin_ok.json()

    # Skills endpoint
    res_skills = client.get("/api/v1/users/skills")
    assert res_skills.status_code == 200
