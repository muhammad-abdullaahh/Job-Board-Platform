from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user, get_current_user_or_admin
from app.models.user import User
from app.repositories.skill_repository import SkillRepository
from app.services.user_service import UserService
from app.schemas.user_schema import UserResponse, UserUpdate, SkillResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = UserService(db)
    return service.update_user_profile(current_user, user_in)


@router.get("/skills", response_model=List[SkillResponse], tags=["Skills"])
def get_all_skills(db: Session = Depends(get_db)):
    repo = SkillRepository(db)
    return repo.get_all()
