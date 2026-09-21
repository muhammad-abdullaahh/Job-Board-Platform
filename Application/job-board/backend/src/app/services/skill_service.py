from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.skill_repository import SkillRepository
from app.models.skill import Skill

class SkillService:
    def __init__(self, db: Session):
        self.repo = SkillRepository(db)

    def get_all(self) -> List[Skill]:
        return self.repo.get_all()

    def create_skill(self, name: str, created_by_user_id: int) -> Skill:
        clean_name = name.strip()
        existing = self.repo.get_by_name(clean_name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill '{clean_name}' already exists."
            )
        return self.repo.create(name=clean_name, created_by_user_id=created_by_user_id)

    def update_skill(self, skill_id: int, new_name: str) -> Skill:
        clean_name = new_name.strip()
        skill = self.repo.get_by_id(skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill #{skill_id} not found."
            )
        existing = self.repo.get_by_name(clean_name)
        if existing and existing.skill_id != skill_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill '{clean_name}' already exists."
            )
        return self.repo.update(skill, clean_name)

    def delete_skill(self, skill_id: int) -> str:
        skill = self.repo.get_by_id(skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill #{skill_id} not found."
            )
        name = skill.name
        self.repo.delete(skill)
        return name
