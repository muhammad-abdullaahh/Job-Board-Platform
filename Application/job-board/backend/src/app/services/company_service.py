from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository
from app.models.company import Company

class CompanyService:
    def __init__(self, db: Session):
        self.company_repo = CompanyRepository(db)
        self.user_repo = UserRepository(db)

    def _check_company_ownership(self, company: Company, user_id: Optional[int]):
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials required."
            )
        user = self.user_repo.get_user_by_id(user_id)
        is_admin = user.is_admin if user else False
        is_owner = (company.created_by == user_id) or (company.created_by is None and company.updated_by == user_id)
        if not is_admin and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage your own company profile."
            )

    def list_companies(self, skip: int = 0, limit: int = 100, q: Optional[str] = None) -> List[Company]:
        return self.company_repo.get_all(skip=skip, limit=limit, q=q)

    def get_my_company(self, user_id: int) -> Optional[Company]:
        return self.company_repo.get_by_owner(user_id)

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
        self._check_company_ownership(company, updater_user_id)

        # Prevent non-admin users from self-verifying companies via update payload
        if hasattr(company_in, 'is_verified') and company_in.is_verified is not None:
            user = self.user_repo.get_user_by_id(updater_user_id) if updater_user_id else None
            if not user or not user.is_admin:
                company_in.is_verified = company.is_verified

        return self.company_repo.update(company, company_in, updater_user_id)

    def rename_company(self, company_id: int, new_name: str, updated_by_user_id: int) -> Company:
        company = self.get_company(company_id)
        self._check_company_ownership(company, updated_by_user_id)
        return self.company_repo.rename(company, new_name, updated_by_user_id)

    def delete_company(self, company_id: int, deleted_by_user_id: int) -> Company:
        company = self.get_company(company_id)
        self._check_company_ownership(company, deleted_by_user_id)
        return self.company_repo.soft_delete(company, deleted_by_user_id)
