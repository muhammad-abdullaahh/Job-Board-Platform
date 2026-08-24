from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user_or_admin, get_current_admin
from app.models import Admin
from app.services.company_service import CompanyService
from app.schemas.company_schema import CompanyCreate, CompanyUpdate, CompanyResponse

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
    current_auth: dict = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    return service.create_company(company_in)


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_in: CompanyUpdate,
    current_auth: dict = Depends(get_current_user_or_admin),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    admin_id = current_auth["id"] if current_auth["type"] == "admin" else None
    return service.update_company(company_id, company_in, admin_id=admin_id)
