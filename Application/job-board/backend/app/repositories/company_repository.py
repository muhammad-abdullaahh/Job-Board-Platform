from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.company import Company


class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Company]:
        # TODO: Query all active companies (deleted_at is None), apply skip/limit
        pass

    def get_by_id(self, company_id: int) -> Optional[Company]:
        # TODO: Query Company by company_id, filter deleted_at is None
        pass

    def create(self, company_in) -> Company:
        # TODO: Build Company from company_in, add to DB, commit, refresh, return
        pass

    def update(self, company: Company, company_in, admin_id: Optional[int] = None) -> Company:
        # TODO: Apply field updates, handle is_verified + verified_by, updated_by, commit, refresh, return
        pass

    def rename(self, company: Company, new_name: str, updated_by_user_id: int) -> Company:
        # TODO: Set company.name = new_name
        # TODO: Set company.updated_by = updated_by_user_id
        # TODO: Set company.updated_at = datetime.now(UTC)
        # TODO: Commit, refresh, return
        pass

    def soft_delete(self, company: Company, deleted_by_user_id: int) -> Company:
        # TODO: Set company.deleted_at = datetime.now(UTC)
        # TODO: Set company.deleted_by = deleted_by_user_id
        # TODO: Commit, refresh, return
        pass
