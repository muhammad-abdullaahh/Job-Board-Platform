import os
import sys
import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User
from app.models.company import Company
from app.models.job import Job, EmploymentType, JobStatus
from app.models.application import Application, ApplicationStatus
from app.models.refresh_token import RefreshToken
from app.models.audit_log import AdminAuditLog
from app.core.security import get_password_hash, create_access_token, hash_token
from app.repositories.user_repository import UserRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.job_repository import JobRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.audit_log_repository import AdminAuditLogRepository
from app.utils.cache import api_cache


# Helper to create auth headers
def auth_headers(user: User) -> dict:
    role = "admin" if user.is_admin else "user"
    token = create_access_token({"sub": str(user.user_id), "role": role, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


# =========================================================================
# 1. Enforce lock everywhere
# =========================================================================
def test_locked_user_login_refresh_and_active_token_rejection(client, db_session):
    # Create active user
    pw = "StrongUserPassword123!"
    user = User(
        name="Target User",
        email="target_lock@example.com",
        password=get_password_hash(pw),
        is_admin=False,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Login and verify active access token works
    login_res = client.post("/api/v1/auth/login", json={"email": user.email, "password": pw})
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]
    refresh_token = login_res.cookies.get("refresh_token")

    me_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 200

    # Lock user in DB
    user.is_active = False
    user.locked_at = datetime.now(timezone.utc)
    user.lock_reason = "Suspicious behavior"
    db_session.commit()

    # 1. Login must fail with 403 ACCOUNT_LOCKED
    lock_login = client.post("/api/v1/auth/login", json={"email": user.email, "password": pw})
    assert lock_login.status_code == 403
    assert lock_login.json().get("code") == "ACCOUNT_LOCKED"

    # 2. Refresh token must fail with 403 ACCOUNT_LOCKED
    lock_refresh = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_token})
    assert lock_refresh.status_code == 403
    assert lock_refresh.json().get("code") == "ACCOUNT_LOCKED"

    # 3. Still-valid 15-minute access token must be rejected immediately on next request
    stale_token_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"})
    assert stale_token_res.status_code == 403
    assert stale_token_res.json().get("code") == "ACCOUNT_LOCKED"


def test_locking_revokes_all_refresh_tokens(client, db_session):
    admin = User(name="Admin User", email="admin_tok@example.com", password=get_password_hash("AdminPass123!"), is_admin=True, is_active=True)
    user = User(name="User Tok", email="user_tok@example.com", password=get_password_hash("UserPass123!"), is_admin=False, is_active=True)
    db_session.add_all([admin, user])
    db_session.commit()

    # Seed 3 refresh tokens for user
    tok1 = RefreshToken(user_id=user.user_id, token_hash=hash_token("raw1"), expires_at=datetime.now(timezone.utc) + timedelta(days=1))
    tok2 = RefreshToken(user_id=user.user_id, token_hash=hash_token("raw2"), expires_at=datetime.now(timezone.utc) + timedelta(days=1))
    tok3 = RefreshToken(user_id=user.user_id, token_hash=hash_token("raw3"), expires_at=datetime.now(timezone.utc) + timedelta(days=1))
    db_session.add_all([tok1, tok2, tok3])
    db_session.commit()

    assert db_session.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).count() == 3

    # Admin locks the user
    lock_res = client.post(
        f"/api/v1/admin/users/{user.user_id}/lock",
        json={"reason": "Security protocol breach"},
        headers=auth_headers(admin)
    )
    assert lock_res.status_code == 200
    assert lock_res.json()["is_active"] is False

    # All refresh tokens must be completely deleted/revoked
    assert db_session.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).count() == 0


# =========================================================================
# 2. Only verified companies can post
# =========================================================================
def test_unverified_company_cannot_create_job_until_verified(client, db_session):
    admin = User(name="Admin Co", email="admin_co@example.com", password=get_password_hash("AdminPass123!"), is_admin=True, is_active=True)
    employer = User(name="Employer Co", email="emp_co@example.com", password=get_password_hash("EmpPass123!"), is_admin=False, is_active=True)
    db_session.add_all([admin, employer])
    db_session.commit()

    # Employer creates company -> is_verified defaults to False
    comp_res = client.post(
        "/api/v1/companies",
        json={"name": "Pioneer Labs", "location": "Austin, TX"},
        headers=auth_headers(employer)
    )
    assert comp_res.status_code == 201
    company_id = comp_res.json()["company_id"]
    assert comp_res.json()["is_verified"] is False

    job_data = {
        "company_id": company_id,
        "title": "Backend Architect",
        "description": "Python FastAPI microservices",
        "salary_min": 120000,
        "salary_max": 180000,
        "employment_type": "full_time"
    }

    # Employer attempts to post job -> 403 COMPANY_NOT_VERIFIED
    fail_res = client.post("/api/v1/jobs", json=job_data, headers=auth_headers(employer))
    assert fail_res.status_code == 403
    assert fail_res.json().get("code") == "COMPANY_NOT_VERIFIED"

    # Admin verifies the company via new admin verify endpoint
    verify_res = client.post(f"/api/v1/admin/companies/{company_id}/verify", headers=auth_headers(admin))
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True

    # Now employer can post successfully
    success_res = client.post("/api/v1/jobs", json=job_data, headers=auth_headers(employer))
    assert success_res.status_code == 201
    assert success_res.json()["title"] == "Backend Architect"


def test_public_job_list_and_detail_exclude_unverified_companies_and_locked_owners(client, db_session):
    admin = User(name="Admin Filter", email="admin_f@example.com", password="hash", is_admin=True, is_active=True)
    active_owner = User(name="Active Owner", email="active_owner@example.com", password="hash", is_admin=False, is_active=True)
    locked_owner = User(name="Locked Owner", email="locked_owner@example.com", password="hash", is_admin=False, is_active=False, lock_reason="Locked")
    deleted_owner = User(name="Deleted Owner", email="deleted_owner@example.com", password="hash", is_admin=False, is_active=False, deleted_at=datetime.now(timezone.utc))

    db_session.add_all([admin, active_owner, locked_owner, deleted_owner])
    db_session.commit()

    # 1. Verified co with active owner
    co_valid = Company(name="Valid Co", created_by=active_owner.user_id, is_verified=True)
    # 2. Unverified co with active owner
    co_unverified = Company(name="Unverified Co", created_by=active_owner.user_id, is_verified=False)
    # 3. Verified co with locked owner
    co_locked = Company(name="Locked Owner Co", created_by=locked_owner.user_id, is_verified=True)
    # 4. Verified co with deleted owner
    co_deleted = Company(name="Deleted Owner Co", created_by=deleted_owner.user_id, is_verified=True)

    db_session.add_all([co_valid, co_unverified, co_locked, co_deleted])
    db_session.commit()

    j1 = Job(title="Valid Active Job", description="Publicly visible", company_id=co_valid.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open, created_by=active_owner.user_id)
    j2 = Job(title="Unverified Co Job", description="Should be hidden", company_id=co_unverified.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open, created_by=active_owner.user_id)
    j3 = Job(title="Locked Owner Job", description="Should be hidden", company_id=co_locked.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open, created_by=locked_owner.user_id)
    j4 = Job(title="Deleted Owner Job", description="Should be hidden", company_id=co_deleted.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open, created_by=deleted_owner.user_id)

    db_session.add_all([j1, j2, j3, j4])
    db_session.commit()

    # 1. Public List: must only return j1
    list_res = client.get("/api/v1/jobs")
    assert list_res.status_code == 200
    job_ids = [j["job_id"] for j in list_res.json()]
    assert j1.job_id in job_ids
    assert j2.job_id not in job_ids
    assert j3.job_id not in job_ids
    assert j4.job_id not in job_ids

    # 2. Public Search by query
    search_res = client.get("/api/v1/jobs?q=Job")
    assert search_res.status_code == 200
    search_ids = [j["job_id"] for j in search_res.json()]
    assert j1.job_id in search_ids
    assert j2.job_id not in search_ids
    assert j3.job_id not in search_ids
    assert j4.job_id not in search_ids

    # 3. Public Detail
    assert client.get(f"/api/v1/jobs/{j1.job_id}").status_code == 200
    assert client.get(f"/api/v1/jobs/{j2.job_id}").status_code == 404
    assert client.get(f"/api/v1/jobs/{j3.job_id}").status_code == 404
    assert client.get(f"/api/v1/jobs/{j4.job_id}").status_code == 404


def test_applying_to_unverified_company_or_locked_owner_blocked(client, db_session):
    candidate = User(name="Applicant", email="applicant@example.com", password=get_password_hash("CandPass123!"), is_admin=False, is_active=True)
    active_owner = User(name="Owner Valid", email="owner_v@example.com", password="hash", is_admin=False, is_active=True)
    locked_owner = User(name="Owner Locked", email="owner_l@example.com", password="hash", is_admin=False, is_active=False)
    db_session.add_all([candidate, active_owner, locked_owner])
    db_session.commit()

    co_unverified = Company(name="Unver Co", created_by=active_owner.user_id, is_verified=False)
    co_locked = Company(name="Lock Co", created_by=locked_owner.user_id, is_verified=True)
    db_session.add_all([co_unverified, co_locked])
    db_session.commit()

    j_unverified = Job(title="Job Unver", description="Desc", company_id=co_unverified.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open, created_by=active_owner.user_id)
    j_locked = Job(title="Job Locked", description="Desc", company_id=co_locked.company_id, employment_type=EmploymentType.full_time, status=JobStatus.open, created_by=locked_owner.user_id)
    db_session.add_all([j_unverified, j_locked])
    db_session.commit()

    # Applying to unverified company -> 403 COMPANY_NOT_VERIFIED
    app1 = client.post("/api/v1/applications", json={"job_id": j_unverified.job_id, "cover_letter": "Letter"}, headers=auth_headers(candidate))
    assert app1.status_code == 403
    assert app1.json().get("code") == "COMPANY_NOT_VERIFIED"

    # Applying to job from locked owner -> 403 ACCOUNT_LOCKED
    app2 = client.post("/api/v1/applications", json={"job_id": j_locked.job_id, "cover_letter": "Letter"}, headers=auth_headers(candidate))
    assert app2.status_code == 403
    assert app2.json().get("code") == "ACCOUNT_LOCKED"


def test_company_owner_rules_and_unowned_company_visibility(client, db_session):
    """
    Requirements:
    1. A job from a verified company with no owner is visible in public list, search and detail, and can be applied to.
    2. A job from a verified company whose owner is locked is hidden and cannot be applied to.
    3. A job from a verified company whose owner is soft-deleted is hidden.
    4. A job from an unverified company is hidden even when the owner is active.
    """
    api_cache.clear_all()
    candidate = User(name="Candidate Rules", email="cand_owner_rules@example.com", password=get_password_hash("CandPass123!"), is_admin=False, is_active=True)
    active_owner = User(name="Owner Active Rules", email="owner_act_rules@example.com", password="hash", is_admin=False, is_active=True)
    locked_owner = User(name="Owner Locked Rules", email="owner_lock_rules@example.com", password="hash", is_admin=False, is_active=False)
    deleted_owner = User(name="Owner Deleted Rules", email="owner_del_rules@example.com", password="hash", is_admin=False, is_active=True, deleted_at=datetime.now(timezone.utc))

    db_session.add_all([candidate, active_owner, locked_owner, deleted_owner])
    db_session.commit()

    # 1. Verified company with NO owner (both created_by and updated_by are NULL)
    co_no_owner = Company(name="Unowned Verified Co", created_by=None, updated_by=None, is_verified=True)
    # 2. Verified company with locked owner
    co_locked = Company(name="Locked Owner Co", created_by=locked_owner.user_id, is_verified=True)
    # 3. Verified company with soft-deleted owner
    co_deleted = Company(name="Deleted Owner Co", created_by=deleted_owner.user_id, is_verified=True)
    # 4. Unverified company with active owner
    co_unverified = Company(name="Unverified Co", created_by=active_owner.user_id, is_verified=False)
    # 5. Verified company with active owner (baseline)
    co_active = Company(name="Active Owner Co", created_by=active_owner.user_id, is_verified=True)

    db_session.add_all([co_no_owner, co_locked, co_deleted, co_unverified, co_active])
    db_session.commit()

    j_no_owner = Job(
        title="Unowned Co Engineer",
        description="Engineering role at unowned company",
        company_id=co_no_owner.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=None
    )
    j_locked = Job(
        title="Locked Co Engineer",
        description="Engineering role at locked company",
        company_id=co_locked.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=locked_owner.user_id
    )
    j_deleted = Job(
        title="Deleted Co Engineer",
        description="Engineering role at deleted owner company",
        company_id=co_deleted.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=deleted_owner.user_id
    )
    j_unverified = Job(
        title="Unverified Co Engineer",
        description="Engineering role at unverified company",
        company_id=co_unverified.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=active_owner.user_id
    )
    j_active = Job(
        title="Active Co Engineer",
        description="Engineering role at active company",
        company_id=co_active.company_id,
        employment_type=EmploymentType.full_time,
        status=JobStatus.open,
        created_by=active_owner.user_id
    )

    db_session.add_all([j_no_owner, j_locked, j_deleted, j_unverified, j_active])
    db_session.commit()

    # --- 1. Public List ---
    list_res = client.get("/api/v1/jobs")
    assert list_res.status_code == 200
    list_ids = [j["job_id"] for j in list_res.json()]
    assert j_no_owner.job_id in list_ids
    assert j_active.job_id in list_ids
    assert j_locked.job_id not in list_ids
    assert j_deleted.job_id not in list_ids
    assert j_unverified.job_id not in list_ids

    # --- 2. Public Search ---
    search_res = client.get("/api/v1/jobs?q=Engineer")
    assert search_res.status_code == 200
    search_ids = [j["job_id"] for j in search_res.json()]
    assert j_no_owner.job_id in search_ids
    assert j_active.job_id in search_ids
    assert j_locked.job_id not in search_ids
    assert j_deleted.job_id not in search_ids
    assert j_unverified.job_id not in search_ids

    # Specific query matching unowned job title keyword
    specific_search = client.get("/api/v1/jobs?q=Unowned")
    assert specific_search.status_code == 200
    assert any(j["job_id"] == j_no_owner.job_id for j in specific_search.json())

    # --- 3. Public Detail ---
    assert client.get(f"/api/v1/jobs/{j_no_owner.job_id}").status_code == 200
    assert client.get(f"/api/v1/jobs/{j_active.job_id}").status_code == 200
    assert client.get(f"/api/v1/jobs/{j_locked.job_id}").status_code == 404
    assert client.get(f"/api/v1/jobs/{j_deleted.job_id}").status_code == 404
    assert client.get(f"/api/v1/jobs/{j_unverified.job_id}").status_code == 404

    # --- 4. Apply to Job ---
    # a. A job from a verified company with no owner can be applied to
    apply_unowned = client.post(
        "/api/v1/applications",
        json={"job_id": j_no_owner.job_id, "cover_letter": "Application letter for unowned company"},
        headers=auth_headers(candidate)
    )
    assert apply_unowned.status_code == 201

    # b. A job from a verified company whose owner is locked cannot be applied to
    apply_locked = client.post(
        "/api/v1/applications",
        json={"job_id": j_locked.job_id, "cover_letter": "Letter"},
        headers=auth_headers(candidate)
    )
    assert apply_locked.status_code == 403
    assert apply_locked.json().get("code") == "ACCOUNT_LOCKED"

    # c. A job from a verified company whose owner is soft-deleted cannot be applied to
    apply_deleted = client.post(
        "/api/v1/applications",
        json={"job_id": j_deleted.job_id, "cover_letter": "Letter"},
        headers=auth_headers(candidate)
    )
    assert apply_deleted.status_code == 403
    assert apply_deleted.json().get("code") == "ACCOUNT_LOCKED"

    # d. A job from an unverified company cannot be applied to (even when owner is active)
    apply_unverified = client.post(
        "/api/v1/applications",
        json={"job_id": j_unverified.job_id, "cover_letter": "Letter"},
        headers=auth_headers(candidate)
    )
    assert apply_unverified.status_code == 403
    assert apply_unverified.json().get("code") == "COMPANY_NOT_VERIFIED"


def test_normal_user_cannot_set_is_verified_through_any_route(client, db_session):
    user = User(name="Attacker", email="attacker@example.com", password=get_password_hash("Pass123!"), is_admin=False, is_active=True)
    db_session.add(user)
    db_session.commit()

    # 1. POST /companies with is_verified=True in body -> is_verified stays False
    res = client.post("/api/v1/companies", json={"name": "Hacker Co", "is_verified": True}, headers=auth_headers(user))
    assert res.status_code == 201
    cid = res.json()["company_id"]
    assert res.json()["is_verified"] is False

    # 2. PUT /companies/{id} with is_verified=True in body -> is_verified stays False
    put_res = client.put(f"/api/v1/companies/{cid}", json={"description": "Updated", "is_verified": True}, headers=auth_headers(user))
    assert put_res.status_code == 200
    assert put_res.json()["is_verified"] is False

    # 3. PATCH /companies/{id}/verify -> 403 Forbidden
    patch_res = client.patch(f"/api/v1/companies/{cid}/verify?is_verified=true", headers=auth_headers(user))
    assert patch_res.status_code == 403

    # 4. POST /admin/companies/{id}/verify -> 403 Forbidden
    admin_post = client.post(f"/api/v1/admin/companies/{cid}/verify", headers=auth_headers(user))
    assert admin_post.status_code == 403


# =========================================================================
# 3. Admin access control & safety rules
# =========================================================================
def test_every_admin_endpoint_requires_admin_role_and_auth(client, db_session):
    user = User(name="Regular User", email="regular@example.com", password=get_password_hash("Pass123!"), is_admin=False, is_active=True)
    db_session.add(user)
    db_session.commit()

    user_h = auth_headers(user)

    endpoints = [
        ("GET", "/api/v1/admin/analytics", None),
        ("GET", "/api/v1/admin/jobs", None),
        ("PATCH", "/api/v1/admin/jobs/1/status", {"status": "closed"}),
        ("DELETE", "/api/v1/admin/jobs/1", None),
        ("GET", "/api/v1/admin/companies", None),
        ("GET", "/api/v1/admin/companies/1", None),
        ("POST", "/api/v1/admin/companies/1/verify", None),
        ("POST", "/api/v1/admin/companies/1/unverify", None),
        ("DELETE", "/api/v1/admin/companies/1", None),
        ("GET", "/api/v1/admin/users", None),
        ("GET", "/api/v1/admin/users/1", None),
        ("POST", "/api/v1/admin/users/1/lock", {"reason": "Test"}),
        ("POST", "/api/v1/admin/users/1/unlock", None),
        ("DELETE", "/api/v1/admin/users/1", None),
        ("GET", "/api/v1/admin/applications", None),
        ("GET", "/api/v1/admin/audit-logs", None),
    ]

    for method, path, body in endpoints:
        # No token -> 401
        res_no_auth = client.request(method, path, json=body)
        assert res_no_auth.status_code == 401, f"Failed on {method} {path} without token"

        # Non-admin token -> 403
        res_user_auth = client.request(method, path, json=body, headers=user_h)
        assert res_user_auth.status_code == 403, f"Failed on {method} {path} with regular user token"


def test_admin_cannot_lock_or_delete_self_or_another_admin(client, db_session):
    admin1 = User(name="Admin 1", email="admin1@test.com", password=get_password_hash("AdminPass1!"), is_admin=True, is_active=True)
    admin2 = User(name="Admin 2", email="admin2@test.com", password=get_password_hash("AdminPass2!"), is_admin=True, is_active=True)
    db_session.add_all([admin1, admin2])
    db_session.commit()

    h1 = auth_headers(admin1)

    # 1. Admin cannot lock themselves -> 403 CANNOT_MODIFY_SELF
    self_lock = client.post(f"/api/v1/admin/users/{admin1.user_id}/lock", json={"reason": "Self lock"}, headers=h1)
    assert self_lock.status_code == 403
    assert self_lock.json().get("code") == "CANNOT_MODIFY_SELF"

    # 2. Admin cannot delete themselves -> 403 CANNOT_MODIFY_SELF
    self_del = client.delete(f"/api/v1/admin/users/{admin1.user_id}", headers=h1)
    assert self_del.status_code == 403
    assert self_del.json().get("code") == "CANNOT_MODIFY_SELF"

    # 3. Admin cannot lock another admin -> 403 CANNOT_MODIFY_ADMIN
    other_lock = client.post(f"/api/v1/admin/users/{admin2.user_id}/lock", json={"reason": "Lock admin 2"}, headers=h1)
    assert other_lock.status_code == 403
    assert other_lock.json().get("code") == "CANNOT_MODIFY_ADMIN"

    # 4. Admin cannot unlock another admin -> 403 CANNOT_MODIFY_ADMIN
    other_unlock = client.post(f"/api/v1/admin/users/{admin2.user_id}/unlock", headers=h1)
    assert other_unlock.status_code == 403
    assert other_unlock.json().get("code") == "CANNOT_MODIFY_ADMIN"

    # 5. Admin cannot delete another admin -> 403 CANNOT_MODIFY_ADMIN
    other_del = client.delete(f"/api/v1/admin/users/{admin2.user_id}", headers=h1)
    assert other_del.status_code == 403
    assert other_del.json().get("code") == "CANNOT_MODIFY_ADMIN"


def test_hard_delete_refused_unless_already_locked_or_soft_deleted(client, db_session):
    admin = User(name="Admin Delete", email="admin_del@test.com", password=get_password_hash("Pass123!"), is_admin=True, is_active=True)
    user = User(name="Active Victim", email="victim@test.com", password=get_password_hash("Pass123!"), is_admin=False, is_active=True)
    db_session.add_all([admin, user])
    db_session.commit()

    h = auth_headers(admin)

    # Hard delete an active, unlocked user -> rejected with 400 USER_NOT_LOCKED
    bad_hard = client.delete(f"/api/v1/admin/users/{user.user_id}?hard=true", headers=h)
    assert bad_hard.status_code == 400
    assert bad_hard.json().get("code") == "USER_NOT_LOCKED"

    # Lock user first
    lock_res = client.post(f"/api/v1/admin/users/{user.user_id}/lock", json={"reason": "Pre-delete lock"}, headers=h)
    assert lock_res.status_code == 200

    # Now hard delete succeeds
    good_hard = client.delete(f"/api/v1/admin/users/{user.user_id}?hard=true", headers=h)
    assert good_hard.status_code == 200
    assert "permanently" in good_hard.json()["message"]

    # User no longer exists in DB
    assert db_session.query(User).filter(User.user_id == user.user_id).first() is None


# =========================================================================
# 4. Audit Log Verification
# =========================================================================
def test_mutating_admin_actions_create_exactly_one_audit_row_and_failed_actions_create_none(client, db_session):
    admin = User(name="Admin Auditor", email="auditor@test.com", password=get_password_hash("Pass123!"), is_admin=True, is_active=True)
    user = User(name="Normal User", email="norm@test.com", password=get_password_hash("Pass123!"), is_admin=False, is_active=True)
    db_session.add_all([admin, user])
    db_session.commit()

    company = Company(name="Audit Co", created_by=user.user_id, is_verified=False)
    db_session.add(company)
    db_session.commit()

    h = {**auth_headers(admin), "X-CMS-Actor": "cms_admin_alice"}

    initial_audit_count = db_session.query(AdminAuditLog).count()

    # 1. Verify company -> +1 audit row
    v_res = client.post(f"/api/v1/admin/companies/{company.company_id}/verify", headers=h)
    assert v_res.status_code == 200
    assert db_session.query(AdminAuditLog).count() == initial_audit_count + 1
    last_log = db_session.query(AdminAuditLog).order_by(AdminAuditLog.id.desc()).first()
    assert last_log.action == "COMPANY_VERIFIED"
    assert last_log.actor_label == "cms_admin_alice"
    assert last_log.target_type == "company"
    assert last_log.target_id == company.company_id

    # 2. Unverify company -> +1 audit row
    uv_res = client.post(f"/api/v1/admin/companies/{company.company_id}/unverify", headers=h)
    assert uv_res.status_code == 200
    assert db_session.query(AdminAuditLog).count() == initial_audit_count + 2
    last_log = db_session.query(AdminAuditLog).order_by(AdminAuditLog.id.desc()).first()
    assert last_log.action == "COMPANY_UNVERIFIED"

    # 3. Lock user -> +1 audit row
    l_res = client.post(f"/api/v1/admin/users/{user.user_id}/lock", json={"reason": "Abusive listings"}, headers=h)
    assert l_res.status_code == 200
    assert db_session.query(AdminAuditLog).count() == initial_audit_count + 3
    last_log = db_session.query(AdminAuditLog).order_by(AdminAuditLog.id.desc()).first()
    assert last_log.action == "USER_LOCKED"
    assert last_log.details.get("reason") == "Abusive listings"

    # 4. Failed action (e.g. self-lock) -> audit count UNCHANGED
    fail_res = client.post(f"/api/v1/admin/users/{admin.user_id}/lock", json={"reason": "Cannot lock myself"}, headers=h)
    assert fail_res.status_code == 403
    assert db_session.query(AdminAuditLog).count() == initial_audit_count + 3

    # 5. Unlock user -> +1 audit row
    ul_res = client.post(f"/api/v1/admin/users/{user.user_id}/unlock", headers=h)
    assert ul_res.status_code == 200
    assert db_session.query(AdminAuditLog).count() == initial_audit_count + 4
    last_log = db_session.query(AdminAuditLog).order_by(AdminAuditLog.id.desc()).first()
    assert last_log.action == "USER_UNLOCKED"

    # 6. Query audit logs via GET /admin/audit-logs
    audit_list = client.get("/api/v1/admin/audit-logs", headers=h)
    assert audit_list.status_code == 200
    logs = audit_list.json()
    assert len(logs) >= 4
    # Newest first
    assert logs[0]["action"] == "USER_UNLOCKED"


# =========================================================================
# 5. Repository tests for admin filters and pagination
# =========================================================================
def test_repositories_admin_list_filters_and_pagination(db_session):
    u_repo = UserRepository(db_session)
    c_repo = CompanyRepository(db_session)
    j_repo = JobRepository(db_session)
    a_repo = ApplicationRepository(db_session)
    log_repo = AdminAuditLogRepository(db_session)

    # 1. Users pagination and filter
    for i in range(5):
        u = User(name=f"User {i}", email=f"user_{i}@filter.com", password="hash", is_active=(i % 2 == 0), is_admin=(i == 0))
        db_session.add(u)
    db_session.commit()

    active_users = u_repo.list_users_admin(is_active=True, limit=10)
    assert all(u.is_active is True for u in active_users)
    paged_users = u_repo.list_users_admin(skip=2, limit=2)
    assert len(paged_users) == 2

    # 2. Companies pagination and filter
    for i in range(5):
        c = Company(name=f"Enterprise {i}", is_verified=(i % 2 == 0))
        db_session.add(c)
    db_session.commit()

    verified_cos = c_repo.list_companies_admin(is_verified=True, limit=10)
    assert all(c.is_verified is True for c in verified_cos)

    # 3. Jobs pagination and filter
    target_co = c_repo.list_companies_admin(limit=1)[0]
    for i in range(4):
        j = Job(
            title=f"Position {i}",
            description=f"Description for job {i}",
            company_id=target_co.company_id,
            employment_type=EmploymentType.full_time,
            status=JobStatus.open,
        )
        db_session.add(j)
    db_session.commit()

    jobs = j_repo.list_jobs_admin(company_id=target_co.company_id, limit=2)
    assert len(jobs) == 2

    # 4. Applications admin filter
    target_job = jobs[0]
    app_user = active_users[0]
    app = Application(job_id=target_job.job_id, user_id=app_user.user_id, cover_letter="Letter", status=ApplicationStatus.pending)
    db_session.add(app)
    db_session.commit()

    apps = a_repo.list_applications_admin(company_id=target_co.company_id)
    assert len(apps) >= 1
    assert apps[0].job_id == target_job.job_id

    # 5. Audit logs filter
    admin_u = active_users[0]
    log_repo.create(admin_user_id=admin_u.user_id, action="CUSTOM_TEST_ACTION", target_type="test", target_id=99)
    filtered_logs = log_repo.list_logs(action="CUSTOM_TEST_ACTION")
    assert len(filtered_logs) == 1
    assert filtered_logs[0].target_id == 99


# =========================================================================
# 6. CMS service account creation script test
# =========================================================================
def test_cms_service_account_script(db_session, monkeypatch):
    import scripts.create_cms_service_account as script_mod

    # Missing email -> SystemExit(1)
    monkeypatch.delenv("CMS_SERVICE_EMAIL", raising=False)
    monkeypatch.setenv("CMS_SERVICE_PASSWORD", "A" * 25)
    with pytest.raises(SystemExit) as exc:
        script_mod.run(db=db_session)
    assert exc.value.code == 1

    # Password too short (< 20 chars) -> SystemExit(1)
    monkeypatch.setenv("CMS_SERVICE_EMAIL", "cms@service.internal")
    monkeypatch.setenv("CMS_SERVICE_PASSWORD", "short_pass_123")
    with pytest.raises(SystemExit) as exc:
        script_mod.run(db=db_session)
    assert exc.value.code == 1

    # Valid invocation -> creates user
    test_pw = "VerySecurePayloadCMSProxyPassword2026!"
    monkeypatch.setenv("CMS_SERVICE_EMAIL", "cms@service.internal")
    monkeypatch.setenv("CMS_SERVICE_PASSWORD", test_pw)

    script_mod.run(db=db_session)

    user = db_session.query(User).filter(User.email == "cms@service.internal").first()
    assert user is not None
    assert user.is_admin is True
    assert user.is_active is True

    # Run again -> idempotent update
    script_mod.run(db=db_session)
    user2 = db_session.query(User).filter(User.email == "cms@service.internal").first()
    assert user2.user_id == user.user_id
