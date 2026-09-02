from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_admin
from app.models.user import User
from app.services.user_service import UserService
from app.repositories.skill_repository import SkillRepository
from app.schemas.user_schema import UserResponse, UserUpdate, AdminRoleUpdate, SkillResponse, SkillCreate

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

@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = UserService(db)
    return service.get_all_users()

@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_in: AdminRoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = UserService(db)
    return service.update_user_role(user_id, is_admin=role_in.is_admin)

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def soft_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = UserService(db)
    service.delete_user(user_id, deleted_by_user_id=admin.user_id)
    return {"message": f"User #{user_id} soft-deleted successfully."}

@router.post("/{user_id}/restore", response_model=UserResponse)
def restore_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    service = UserService(db)
    return service.restore_user(user_id)

@router.get("/skills", response_model=List[SkillResponse], tags=["Skills"])
def get_all_skills(db: Session = Depends(get_db)):
    repo = SkillRepository(db)
    return repo.get_all()

@router.post("/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED, tags=["Skills"])
def create_skill(
    skill_in: SkillCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    repo = SkillRepository(db)
    existing = repo.get_by_name(skill_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Skill '{skill_in.name}' already exists."
        )
    return repo.create(name=skill_in.name, created_by_user_id=admin.user_id)

@router.put("/skills/{skill_id}", response_model=SkillResponse, tags=["Skills"])
def update_skill(
    skill_id: int,
    skill_in: SkillCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    repo = SkillRepository(db)
    skill = repo.get_by_id(skill_id)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill #{skill_id} not found."
        )
    existing = repo.get_by_name(skill_in.name)
    if existing and existing.skill_id != skill_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Skill '{skill_in.name}' already exists."
        )
    return repo.update(skill, skill_in.name)

@router.delete("/skills/{skill_id}", status_code=status.HTTP_200_OK, tags=["Skills"])
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    repo = SkillRepository(db)
    skill = repo.get_by_id(skill_id)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill #{skill_id} not found."
        )
    name = skill.name
    repo.delete(skill)
    return {"message": f"Skill '{name}' deleted successfully."}
