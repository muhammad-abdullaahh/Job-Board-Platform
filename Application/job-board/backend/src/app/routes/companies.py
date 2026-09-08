from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_admin
from app.models.user import User
from app.services.company_service import CompanyService
from app.schemas.company_schema import (
    CompanyCreate,
    CompanyUpdate,
    CompanyRenameRequest,
    CompanyResponse,
    PublicCompanyResponse
)
from app.utils.cache import api_cache

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("", response_model=List[PublicCompanyResponse])
def list_companies(
    response: Response,
    q: Optional[str] = Query(None, description="Search company by name or location"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=60"
    cache_key = f"companies:list:{q}:{skip}:{limit}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        return cached

    service = CompanyService(db)
    raw_companies = service.list_companies(skip=skip, limit=limit, q=q)
    validated = [PublicCompanyResponse.model_validate(c) for c in raw_companies]
    api_cache.set(cache_key, validated, ttl=60)
    response.headers["X-Cache"] = "MISS"
    return validated

@router.get("/me", response_model=Optional[CompanyResponse])
def get_my_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    return service.get_my_company(current_user.user_id)

@router.get("/{company_id}", response_model=PublicCompanyResponse)
def get_company(company_id: int, response: Response, db: Session = Depends(get_db)):
    cache_key = f"companies:detail:{company_id}"
    cached = api_cache.get(cache_key)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
        return cached

    service = CompanyService(db)
    comp = service.get_company(company_id)
    validated = PublicCompanyResponse.model_validate(comp)
    api_cache.set(cache_key, validated, ttl=120)
    response.headers["X-Cache"] = "MISS"
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    return validated

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_in: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    created = service.create_company(company_in, created_by_user_id=current_user.user_id)
    api_cache.clear_prefix("companies:")
    return created

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_in: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    updated = service.update_company(company_id, company_in, updater_user_id=current_user.user_id)
    api_cache.clear_prefix("companies:")
    api_cache.clear_prefix("jobs:")
    return updated

@router.patch("/{company_id}/verify", response_model=CompanyResponse)
def verify_company(
    company_id: int,
    is_verified: bool = Query(True, description="Verification status to set"),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    comp_update = CompanyUpdate(is_verified=is_verified)
    verified = service.update_company(company_id, comp_update, updater_user_id=admin_user.user_id)
    api_cache.clear_prefix("companies:")
    api_cache.clear_prefix("jobs:")
    return verified

@router.patch("/{company_id}/name", response_model=CompanyResponse)
def rename_company(
    company_id: int,
    rename_in: CompanyRenameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    renamed = service.rename_company(company_id, rename_in.name, updated_by_user_id=current_user.user_id)
    api_cache.clear_prefix("companies:")
    api_cache.clear_prefix("jobs:")
    return renamed

@router.delete("/{company_id}", status_code=status.HTTP_200_OK)
def delete_company(
    company_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    service = CompanyService(db)
    service.delete_company(company_id, deleted_by_user_id=admin_user.user_id)
    api_cache.clear_prefix("companies:")
    api_cache.clear_prefix("jobs:")
    return {"message": f"Company #{company_id} soft-deleted successfully."}
