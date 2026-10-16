import pytest
from fastapi import HTTPException
from app.services.user_service import UserService
from app.schemas.user_schema import UserUpdate
from app.models.user import User
from app.models.skill import Skill
from app.core.security import get_password_hash

def test_user_service_profile_and_search(db_session):
    service = UserService(db_session)
    user = User(
        name="Candidate One",
        email="cand1@example.com",
        password=get_password_hash("Password123!"),
        bio="Python backend specialist",
        years_of_experience=4,
    )
    skill = Skill(name="FastAPI")
    user.skills.append(skill)
    db_session.add_all([user, skill])
    db_session.commit()

    # Get profile
    profile = service.get_user_profile(user.user_id)
    assert profile.name == "Candidate One"
    assert profile.years_of_experience == 4

    # 404 on nonexistent user
    with pytest.raises(HTTPException) as exc:
        service.get_user_profile(99999)
    assert exc.value.status_code == 404

    # Search job seekers
    seekers = service.search_job_seekers(skill_ids=[skill.skill_id], min_experience=3)
    assert len(seekers) == 1
    assert seekers[0].user_id == user.user_id

def test_user_service_update_profile(db_session):
    service = UserService(db_session)
    user = User(
        name="Candidate Two",
        email="cand2@example.com",
        password=get_password_hash("Password123!"),
        years_of_experience=1,
    )
    new_skill = Skill(name="Docker")
    db_session.add_all([user, new_skill])
    db_session.commit()

    update_in = UserUpdate(
        name="Candidate Two Updated",
        bio="Now senior engineer",
        years_of_experience=5,
        skill_ids=[new_skill.skill_id]
    )
    updated = service.update_user_profile(user, update_in)
    assert updated.name == "Candidate Two Updated"
    assert updated.years_of_experience == 5
    assert len(updated.skills) == 1
    assert updated.skills[0].name == "Docker"

def test_user_service_delete_own_account(db_session):
    service = UserService(db_session)
    user = User(
        name="Delete Me",
        email="del@example.com",
        password=get_password_hash("MySecret123!"),
    )
    db_session.add(user)
    db_session.commit()

    # Incorrect password fails
    with pytest.raises(HTTPException) as exc:
        service.delete_own_account(user, "WrongPassword")
    assert exc.value.status_code == 400

    # Correct password deletes
    deleted = service.delete_own_account(user, "MySecret123!")
    assert deleted.deleted_at is not None

def test_user_service_prevent_deleting_last_admin(db_session):
    service = UserService(db_session)
    sole_admin = User(
        name="Sole Admin",
        email="admin@example.com",
        password=get_password_hash("AdminPass123!"),
        is_admin=True,
    )
    db_session.add(sole_admin)
    db_session.commit()

    # Attempting to delete the only active admin fails
    with pytest.raises(HTTPException) as exc:
        service.delete_own_account(sole_admin, "AdminPass123!")
    assert exc.value.status_code == 400
    assert "only active administrator" in exc.value.detail

def test_user_service_admin_suspension_and_restore(db_session):
    service = UserService(db_session)
    user = User(
        name="Regular User",
        email="reg@example.com",
        password=get_password_hash("Password123!"),
    )
    db_session.add(user)
    db_session.commit()

    # Admin suspends user
    suspended = service.delete_user(user.user_id, deleted_by_user_id=1)
    assert suspended.deleted_at is not None

    # Suspending again raises 400
    with pytest.raises(HTTPException):
        service.delete_user(user.user_id)

    # Restoring user
    restored = service.restore_user(user.user_id)
    assert restored.deleted_at is None

    # Restoring already active user raises 400
    with pytest.raises(HTTPException):
        service.restore_user(user.user_id)

    # Update role
    promoted = service.update_user_role(user.user_id, is_admin=True)
    assert promoted.is_admin is True
