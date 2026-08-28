from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.application_service import ApplicationService
from app.schemas.application_schema import ApplicationCreate, ApplicationStatusUpdate, ApplicationResponse

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ApplicationService(db)
    return service.apply_to_job(user_id=current_user.user_id, app_in=app_in)

@router.get("/me", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ApplicationService(db)
    return service.get_my_applications(user_id=current_user.user_id)

@router.get("/job/{job_id}", response_model=List[ApplicationResponse])
def get_job_applications(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ApplicationService(db)
    return service.get_job_applications(job_id=job_id, requesting_user_id=current_user.user_id)

@router.put("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    status_in: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = ApplicationService(db)
    return service.update_application_status(
        application_id=application_id,
        new_status=status_in.status,
        updater_user_id=current_user.user_id
    )
