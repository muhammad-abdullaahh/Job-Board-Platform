from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.company import Company

class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Company]:
        return (
            self.db.query(Company)
            .filter(Company.deleted_at.is_(None))
            .order_by(Company.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, company_id: int) -> Optional[Company]:
        return (
            self.db.query(Company)
            .filter(
                Company.company_id == company_id,
                Company.deleted_at.is_(None)
            )
            .first()
        )

    def get_by_owner(self, user_id: int) -> Optional[Company]:
        return (
            self.db.query(Company)
            .filter(
                Company.updated_by == user_id,
                Company.deleted_at.is_(None)
            )
            .first()
        )

    def create(self, company_in, created_by_user_id: Optional[int] = None) -> Company:
        company = Company(
            name=company_in.name,
            description=company_in.description,
            website=company_in.website,
            location=company_in.location,
            is_verified=False,
            updated_by=created_by_user_id,
        )
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company

    def update(self, company: Company, company_in, updater_user_id: Optional[int] = None) -> Company:
        update_data = company_in.dict(exclude_unset=True)
        is_verified = update_data.pop('is_verified', None)

        # Update remaining data fields
        for field, value in update_data.items():
            setattr(company, field, value)

        if is_verified is not None:
            company.is_verified = is_verified
            if is_verified and updater_user_id:
                company.verified_by = updater_user_id

        # Only update owner/updated_by if updating info fields, not solely verifying
        if updater_user_id and update_data:
            company.updated_by = updater_user_id

        self.db.commit()
        self.db.refresh(company)
        return company

    def rename(self, company: Company, new_name: str, updated_by_user_id: int) -> Company:
        company.name = new_name
        company.updated_by = updated_by_user_id
        self.db.commit()
        self.db.refresh(company)
        return company

    def soft_delete(self, company: Company, deleted_by_user_id: int) -> Company:
        company.deleted_at = datetime.now(timezone.utc)
        company.deleted_by = deleted_by_user_id
        self.db.commit()
        self.db.refresh(company)
        return company
