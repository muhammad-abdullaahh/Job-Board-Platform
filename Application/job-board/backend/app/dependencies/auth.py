from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # TODO: Decode the token, extract "sub" (user_id)
    # TODO: Query User by user_id where deleted_at is None
    # TODO: Raise UnauthorizedException if token invalid or user not found
    # TODO: Return the User object
    pass
