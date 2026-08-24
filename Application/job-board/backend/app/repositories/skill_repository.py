from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.skill import Skill


class SkillRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Skill]:
        return self.db.query(Skill).all()

    def get_by_id(self, skill_id: int) -> Optional[Skill]:
        return self.db.query(Skill).filter(Skill.skill_id == skill_id).first()

    def get_by_name(self, name: str) -> Optional[Skill]:
        return self.db.query(Skill).filter(Skill.name.ilike(name)).first()

    def create(self, name: str, admin_id: Optional[int] = None) -> Skill:
        skill = Skill(name=name, created_by=admin_id)
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        return skill
