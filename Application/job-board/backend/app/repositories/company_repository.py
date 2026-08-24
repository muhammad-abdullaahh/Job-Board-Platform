from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.company import Company
from app.schemas.company_schema import CompanyCreate, CompanyUpdate


class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Company]:
        return self.db.query(Company).filter(Company.deleted_at.is_(None)).offset(skip).limit(limit).all()

    def get_by_id(self, company_id: int) -> Optional[Company]:
        return self.db.query(Company).filter(Company.company_id == company_id, Company.deleted_at.is_(None)).first()

    def create(self, company_in: CompanyCreate) -> Company:
        company = Company(
            name=company_in.name,
            description=company_in.description,
            website=company_in.website,
            location=company_in.location
        )
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company

    def update(self, company: Company, company_in: CompanyUpdate, admin_id: Optional[int] = None) -> Company:
        if company_in.name is not None:
            company.name = company_in.name
        if company_in.description is not None:
            company.description = company_in.description
        if company_in.website is not None:
            company.website = company_in.website
        if company_in.location is not None:
            company.location = company_in.location
        if company_in.is_verified is not None:
            company.is_verified = company_in.is_verified
            if admin_id and company_in.is_verified:
                company.verified_by = admin_id
        
        if admin_id:
            company.updated_by = admin_id

        self.db.commit()
        self.db.refresh(company)
        return company
