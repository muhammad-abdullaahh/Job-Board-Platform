from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.models.user import User


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Allow only users where is_admin=True.
    Use on routes restricted to admins
    (e.g. verifying a company, managing skills, soft-deleting a user).
    """
    # TODO: Check current_user.is_admin == True
    # TODO: If False, raise HTTP 403 Forbidden
    # TODO: Return current_user
    pass


def require_regular_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Allow only users where is_admin=False.
    Use on routes restricted to job seekers
    (e.g. submitting an application, viewing own applications).
    """
    # TODO: Check current_user.is_admin == False
    # TODO: If True (i.e. user is an admin), raise HTTP 403 Forbidden
    # TODO: Return current_user
    pass


def require_admin_or_self(user_id: int, current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Allow Admins OR the User themselves.
    Use on routes where a user can act on their own data,
    but an admin can act on anyone's data
    (e.g. updating a profile, viewing a specific user's applications).
    """
    # TODO: If current_user.is_admin == True, allow through
    # TODO: If current_user.user_id == user_id, allow through
    # TODO: Otherwise raise HTTP 403 Forbidden
    # TODO: Return current_user
    pass
