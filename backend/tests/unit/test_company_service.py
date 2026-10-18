import pytest
from fastapi import HTTPException
from app.services.company_service import CompanyService
from app.schemas.company_schema import CompanyCreate, CompanyUpdate
from app.models.user import User

def test_company_service_create_and_ownership(db_session):
    service = CompanyService(db_session)
    owner = User(name="Founder", email="founder@companytest.com", password="hash")
    admin = User(name="Admin", email="admin@companytest.com", password="hash", is_admin=True)
    db_session.add_all([owner, admin])
    db_session.commit()

    company_in = CompanyCreate(
        name="Startup Ventures",
        description="Early stage startup",
        website="https://startup.io",
        location="Austin, TX",
    )
    company = service.create_company(company_in, created_by_user_id=owner.user_id)
    assert company.company_id is not None
    assert company.name == "Startup Ventures"
    assert company.is_verified is False

    # Creating second company for same owner should fail
    with pytest.raises(HTTPException) as exc_info:
        service.create_company(company_in, created_by_user_id=owner.user_id)
    assert exc_info.value.status_code == 400

def test_company_service_get_and_list(db_session):
    service = CompanyService(db_session)
    owner = User(name="Founder2", email="founder2@companytest.com", password="hash")
    db_session.add(owner)
    db_session.commit()

    # 404 for nonexistent company
    with pytest.raises(HTTPException) as exc:
        service.get_company(99999)
    assert exc.value.status_code == 404

    company_in = CompanyCreate(name="Alpha Co")
    created = service.create_company(company_in, created_by_user_id=owner.user_id)

    # Get by ID
    found = service.get_company(created.company_id)
    assert found.name == "Alpha Co"

    # Get my company
    my_co = service.get_my_company(owner.user_id)
    assert my_co is not None
    assert my_co.company_id == created.company_id

    # List companies
    companies = service.list_companies()
    assert len(companies) >= 1

def test_company_service_update_and_verification_security(db_session):
    service = CompanyService(db_session)
    owner = User(name="Founder3", email="founder3@companytest.com", password="hash")
    intruder = User(name="Intruder", email="intruder@companytest.com", password="hash")
    admin = User(name="Admin3", email="admin3@companytest.com", password="hash", is_admin=True)
    db_session.add_all([owner, intruder, admin])
    db_session.commit()

    company_in = CompanyCreate(name="Beta Co")
    company = service.create_company(company_in, created_by_user_id=owner.user_id)

    # Intruder update fails with 403
    with pytest.raises(HTTPException) as exc_info:
        service.update_company(company.company_id, CompanyUpdate(description="Hacked"), updater_user_id=intruder.user_id)
    assert exc_info.value.status_code == 403

    # Owner updates description -> is_verified stays False!
    owner_update = CompanyUpdate(description="Legit description")
    updated = service.update_company(company.company_id, owner_update, updater_user_id=owner.user_id)
    assert updated.description == "Legit description"
    assert updated.is_verified is False

    # Admin verifies -> is_verified becomes True
    from app.services.admin_service import AdminService
    admin_service = AdminService(db_session)
    admin_verified = admin_service.verify_company(company.company_id, admin_user_id=admin.user_id)
    assert admin_verified.is_verified is True

def test_company_service_rename_and_delete(db_session):
    service = CompanyService(db_session)
    owner = User(name="Founder4", email="founder4@companytest.com", password="hash")
    db_session.add(owner)
    db_session.commit()

    company = service.create_company(CompanyCreate(name="Initial Name"), created_by_user_id=owner.user_id)

    # Rename
    renamed = service.rename_company(company.company_id, "New Name Inc", updated_by_user_id=owner.user_id)
    assert renamed.name == "New Name Inc"

    # Soft delete
    deleted = service.delete_company(company.company_id, deleted_by_user_id=owner.user_id)
    assert deleted.deleted_at is not None
