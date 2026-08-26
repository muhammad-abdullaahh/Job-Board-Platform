from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User, Admin
from app.core.security import get_password_hash

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(
                User.email == email,
                User.deleted_at.is_(None)
            )
            .first()
        )

    def get_admin_by_email(self, email: str) -> Optional[Admin]:
        return self.db.query(Admin).filter(Admin.email == email).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(
                User.user_id == user_id,
                User.deleted_at.is_(None)
            )
            .first()
        )

    def get_all_users(self) -> List[User]:
        return (
            self.db.query(User)
            .filter(User.deleted_at.is_(None))
            .order_by(User.created_at.desc())
            .all()
        )

    def create_user(self, user_in) -> User:
        hashed_pw = get_password_hash(user_in.password)
        user = User(
            name=user_in.name,
            email=user_in.email,
            password=hashed_pw,
            bio=getattr(user_in, 'bio', None),
            years_experience=getattr(user_in, 'years_experience', 0),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_admin(self, admin_in) -> Admin:
        hashed_pw = get_password_hash(admin_in.password)
        admin = Admin(
            name=admin_in.name,
            email=admin_in.email,
            password=hashed_pw,
        )
        self.db.add(admin)
        self.db.commit()
        self.db.refresh(admin)
        return admin

    def update_user(self, user: User, user_in) -> User:
        update_data = user_in.dict(exclude_unset=True)
        if 'password' in update_data and update_data['password']:
            update_data['password'] = get_password_hash(update_data['password'])

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user_password(self, user: User, new_hashed_password: str) -> User:
        user.password = new_hashed_password
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_admin_password(self, admin: Admin, new_hashed_password: str) -> Admin:
        admin.password = new_hashed_password
        self.db.commit()
        self.db.refresh(admin)
        return admin

    def soft_delete_user(self, user: User) -> User:
        user.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user
