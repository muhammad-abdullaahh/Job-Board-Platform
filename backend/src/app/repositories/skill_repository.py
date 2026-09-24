# Skill Repository
# Manages database access for standard platform skills and tags.
# Provides methods to query, create, and search skills by name.

from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.skill import Skill

class SkillRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Skill]:
        return self.db.query(Skill).order_by(Skill.name.asc()).all()

    def get_by_id(self, skill_id: int) -> Optional[Skill]:
        return self.db.query(Skill).filter(Skill.skill_id == skill_id).first()

    def get_by_name(self, name: str) -> Optional[Skill]:
        return self.db.query(Skill).filter(Skill.name.ilike(name)).first()

    def create(self, name: str, created_by_user_id: Optional[int] = None) -> Skill:
        skill = Skill(
            name=name,
            created_by=created_by_user_id
        )
        try:
            self.db.add(skill)
            self.db.commit()
            self.db.refresh(skill)
            return skill
        except Exception:
            self.db.rollback()
            raise

    def update(self, skill: Skill, new_name: str) -> Skill:
        skill.name = new_name
        try:
            self.db.commit()
            self.db.refresh(skill)
            return skill
        except Exception:
            self.db.rollback()
            raise

    def delete(self, skill: Skill) -> None:
        try:
            self.db.delete(skill)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
