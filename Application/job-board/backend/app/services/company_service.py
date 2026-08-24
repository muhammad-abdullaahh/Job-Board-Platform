from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.company_repository import CompanyRepository
from app.models.company import Company
from app.exceptions.job_exceptions import CompanyNotFoundException


class CompanyService:
    def __init__(self, db: Session):
        self.company_repo = CompanyRepository(db)

    def list_companies(self, skip: int = 0, limit: int = 100) -> List[Company]:
        # TODO: Delegate to company_repo.get_all
        pass

    def get_company(self, company_id: int) -> Company:
        # TODO: Fetch company via company_repo.get_by_id, raise CompanyNotFoundException if missing
        pass

    def create_company(self, company_in) -> Company:
        # TODO: Delegate create to company_repo
        pass

    def update_company(self, company_id: int, company_in, admin_id: Optional[int] = None) -> Company:
        # TODO: Fetch company (raise CompanyNotFoundException if missing), delegate update to company_repo
        pass

    def rename_company(self, company_id: int, new_name: str, updated_by_user_id: int) -> Company:
        # TODO: Fetch company (raise CompanyNotFoundException if missing)
        # TODO: Delegate rename to company_repo
        pass

    def delete_company(self, company_id: int, deleted_by_user_id: int) -> Company:
        # TODO: Fetch company (raise CompanyNotFoundException if missing)
        # TODO: Delegate soft_delete to company_repo
        pass
