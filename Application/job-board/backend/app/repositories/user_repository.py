from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User, Admin
from app.schemas.auth_schema import UserRegisterRequest, AdminRegisterRequest
from app.schemas.user_schema import UserUpdate
from app.core.security import get_password_hash


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()

    def get_admin_by_email(self, email: str) -> Optional[Admin]:
        return self.db.query(Admin).filter(Admin.email == email).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.user_id == user_id, User.deleted_at.is_(None)).first()

    def create_user(self, user_in: UserRegisterRequest) -> User:
        db_user = User(
            name=user_in.name,
            email=user_in.email,
            password=get_password_hash(user_in.password),
            bio=user_in.bio,
            years_of_experience=user_in.years_of_experience
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def create_admin(self, admin_in: AdminRegisterRequest) -> Admin:
        db_admin = Admin(
            name=admin_in.name,
            email=admin_in.email,
            password=get_password_hash(admin_in.password)
        )
        self.db.add(db_admin)
        self.db.commit()
        self.db.refresh(db_admin)
        return db_admin

    def update_user(self, user: User, user_in: UserUpdate) -> User:
        if user_in.name is not None:
            user.name = user_in.name
        if user_in.bio is not None:
            user.bio = user_in.bio
        if user_in.years_of_experience is not None:
            user.years_of_experience = user_in.years_of_experience
        
        self.db.commit()
        self.db.refresh(user)
        return user
