from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.company_repository import CompanyRepository
from app.models.company import Company

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
                detail=f"Company #{company_id} not found."
            )
        return company

    def create_company(self, company_in, created_by_user_id: Optional[int] = None) -> Company:
        if created_by_user_id:
            existing = self.company_repo.get_by_owner(created_by_user_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You already have a registered company profile."
                )
        return self.company_repo.create(company_in, created_by_user_id)

    def update_company(self, company_id: int, company_in, updater_user_id: Optional[int] = None) -> Company:
        company = self.get_company(company_id)
        return self.company_repo.update(company, company_in, updater_user_id)

    def rename_company(self, company_id: int, new_name: str, updated_by_user_id: int) -> Company:
        company = self.get_company(company_id)
        return self.company_repo.rename(company, new_name, updated_by_user_id)

    def delete_company(self, company_id: int, deleted_by_user_id: int) -> Company:
        company = self.get_company(company_id)
        return self.company_repo.soft_delete(company, deleted_by_user_id)
