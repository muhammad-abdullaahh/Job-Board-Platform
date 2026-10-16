import pytest
from fastapi import HTTPException
from app.services.skill_service import SkillService
from app.models.user import User

def test_skill_service_crud_lifecycle(db_session):
    service = SkillService(db_session)
    user = User(name="SkillAdmin", email="admin@skilltest.com", password="hash", is_admin=True)
    db_session.add(user)
    db_session.commit()

    # 1. Create skill
    skill = service.create_skill("Kubernetes", created_by_user_id=user.user_id)
    assert skill.skill_id is not None
    assert skill.name == "Kubernetes"

    # 2. Duplicate create fails with 400
    with pytest.raises(HTTPException) as exc:
        service.create_skill("  Kubernetes  ", created_by_user_id=user.user_id)
    assert exc.value.status_code == 400

    # 3. List skills
    skills = service.get_all()
    assert any(s.name == "Kubernetes" for s in skills)

    # 4. Update skill
    updated = service.update_skill(skill.skill_id, "K8s")
    assert updated.name == "K8s"

    # Update non-existent skill fails with 404
    with pytest.raises(HTTPException) as exc:
        service.update_skill(99999, "NonExistent")
    assert exc.value.status_code == 404

    # 5. Delete skill
    deleted_name = service.delete_skill(skill.skill_id)
    assert deleted_name == "K8s"

    # Delete non-existent skill fails with 404
    with pytest.raises(HTTPException) as exc:
        service.delete_skill(skill.skill_id)
    assert exc.value.status_code == 404
