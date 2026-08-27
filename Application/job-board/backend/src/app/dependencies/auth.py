from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.repositories.user_repository import UserRepository
from app.models.user import User

http_bearer = HTTPBearer(auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(http_bearer),
    token_oauth: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    token = None
    if auth and auth.credentials:
        token = auth.credentials
    elif token_oauth:
        token = token_oauth

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication payload.",
        )

    repo = UserRepository(db)
    user_id = int(user_id_str)
    user = repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deleted.",
        )

    return user

def get_current_user_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Alias for get_current_user since all users (including admins) use the single User identity."""
    return current_user
