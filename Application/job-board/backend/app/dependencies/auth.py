from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.models import User, Admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user_or_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    role: Optional[str] = payload.get("role")  # "user" or "admin"

    if user_id is None or role is None:
        raise credentials_exception

    if role == "admin":
        admin = db.query(Admin).filter(Admin.admin_id == user_id).first()
        if admin is None:
            raise credentials_exception
        return {"type": "admin", "entity": admin, "id": admin.admin_id}
    else:
        user = db.query(User).filter(User.user_id == user_id, User.deleted_at.is_(None)).first()
        if user is None:
            raise credentials_exception
        return {"type": "user", "entity": user, "id": user.user_id}


def get_current_user(
    current: dict = Depends(get_current_user_or_admin)
) -> User:
    if current["type"] != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to registered job seekers / users"
        )
    return current["entity"]


def get_current_admin(
    current: dict = Depends(get_current_user_or_admin)
) -> Admin:
    if current["type"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to administrators"
        )
    return current["entity"]
