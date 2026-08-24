from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.models.skill import Skill
from app.schemas.user_schema import UserUpdate


class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.db = db

    def get_user_profile(self, user_id: int) -> Optional[User]:
        return self.user_repo.get_user_by_id(user_id)

    def update_user_profile(self, user: User, user_in: UserUpdate) -> User:
        if user_in.skill_ids is not None:
            skills = self.db.query(Skill).filter(Skill.skill_id.in_(user_in.skill_ids)).all()
            user.skills = skills

        return self.user_repo.update_user(user, user_in)
