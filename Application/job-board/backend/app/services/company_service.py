from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.company_repository import CompanyRepository
from app.models.company import Company
from app.schemas.company_schema import CompanyCreate, CompanyUpdate


class CompanyService:
    def __init__(self, db: Session):
        self.company_repo = CompanyRepository(db)

    def list_companies(self, skip: int = 0, limit: int = 100) -> List[Company]:
        return self.company_repo.get_all(skip=skip, limit=limit)

    def get_company(self, company_id: int) -> Company:
        company = self.company_repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        return company

    def create_company(self, company_in: CompanyCreate) -> Company:
        return self.company_repo.create(company_in)

    def update_company(self, company_id: int, company_in: CompanyUpdate, admin_id: Optional[int] = None) -> Company:
        company = self.get_company(company_id)
        return self.company_repo.update(company, company_in, admin_id=admin_id)
