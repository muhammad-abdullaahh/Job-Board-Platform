from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.models.user import User

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Allow only users where is_admin=True.
    Use on routes restricted to admins
    (e.g. verifying a company, managing skills, soft-deleting a user).
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )
    return current_user

def require_regular_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Allow only users where is_admin=False.
    Use on routes restricted to job seekers
    (e.g. submitting an application, viewing own applications).
    """
    if current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Action reserved for job seekers."
        )
    return current_user

def require_admin_or_self(user_id: int, current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Allow Admins OR the User themselves.
    Use on routes where a user can act on their own data,
    but an admin can act on anyone's data.
    """
    if current_user.is_admin or current_user.user_id == user_id:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied. You can only perform this action on your own account."
    )
