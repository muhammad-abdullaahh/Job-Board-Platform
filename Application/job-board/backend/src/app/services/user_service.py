from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.models.skill import Skill

class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.db = db

    def get_user_profile(self, user_id: int, include_deleted: bool = False) -> User:
        user = self.user_repo.get_user_by_id(user_id, include_deleted=include_deleted)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User #{user_id} not found."
            )
        return user

    def get_all_users(self) -> List[User]:
        return self.user_repo.get_all_users(include_deleted=True)

    def update_user_profile(self, user: User, user_in) -> User:
        update_data = user_in.dict(exclude_unset=True)
        skill_ids = update_data.pop('skill_ids', None)

        if skill_ids is not None:
            skills = self.db.query(Skill).filter(Skill.skill_id.in_(skill_ids)).all()
            user.skills = skills

        return self.user_repo.update_user(user, user_in)

    def delete_user(self, user_id: int, deleted_by_user_id: Optional[int] = None) -> User:
        user = self.get_user_profile(user_id, include_deleted=False)
        return self.user_repo.soft_delete_user(user, deleted_by_user_id=deleted_by_user_id)

    def restore_user(self, user_id: int) -> User:
        user = self.get_user_profile(user_id, include_deleted=True)
        return self.user_repo.restore_user(user)

    def update_user_role(self, user_id: int, is_admin: bool) -> User:
        user = self.get_user_profile(user_id, include_deleted=True)
        user.is_admin = is_admin
        self.db.commit()
        self.db.refresh(user)
        return user
