from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user, get_current_user_or_admin
from app.dependencies.roles import require_admin
from app.models.user import User
from app.services.company_service import CompanyService
from app.schemas.company_schema import (
    CompanyCreate,
    CompanyUpdate,
    CompanyRenameRequest,
    CompanyResponse
)

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("", response_model=List[CompanyResponse])
def list_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = CompanyService(db)
    return service.list_companies(skip=skip, limit=limit)

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    service = CompanyService(db)
    return service.get_company(company_id)

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_in: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    return service.create_company(company_in, created_by_user_id=current_user.user_id)

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_in: CompanyUpdate,
    current_auth: dict = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    updater_id = current_auth.get("user_id") or current_auth.get("admin_id")
    service = CompanyService(db)
    return service.update_company(company_id, company_in, admin_id=updater_id)

@router.patch("/{company_id}/verify", response_model=CompanyResponse)
def verify_company(
    company_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    comp_update = CompanyUpdate(is_verified=True)
    return service.update_company(company_id, comp_update, admin_id=admin_user.user_id)

@router.patch("/{company_id}/name", response_model=CompanyResponse)
def rename_company(
    company_id: int,
    rename_in: CompanyRenameRequest,
    current_auth: dict = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    updater_id = current_auth.get("user_id") or current_auth.get("admin_id")
    service = CompanyService(db)
    return service.rename_company(company_id, rename_in.name, updated_by_user_id=updater_id)

@router.delete("/{company_id}", status_code=status.HTTP_200_OK)
def delete_company(
    company_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    service.delete_company(company_id, deleted_by_user_id=admin_user.user_id)
    return {"message": f"Company #{company_id} soft-deleted successfully."}
