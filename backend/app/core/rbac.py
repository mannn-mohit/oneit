from functools import wraps
from typing import List

from fastapi import HTTPException, status


def require_permissions(*required_permissions: str):
    """
    Decorator that checks if the current user has all required permissions.
    Used on route handler functions.

    Usage:
        @require_permissions("assets:read", "assets:write")
        async def create_asset(current_user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )

            if current_user.is_superadmin:
                return await func(*args, **kwargs)

            user_permissions = set()
            if current_user.role and current_user.role.permissions:
                for perm in current_user.role.permissions:
                    user_permissions.add(perm.codename)

            missing = set(required_permissions) - user_permissions
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permissions: {', '.join(missing)}",
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def check_permission(user, permission: str) -> bool:
    """Check if a user has a specific permission. Returns bool."""
    if user.is_superadmin:
        return True
    if user.role and user.role.permissions:
        return any(p.codename == permission for p in user.role.permissions)
    return False


def get_user_permissions(user) -> List[str]:
    """Get list of all permission codenames for a user."""
    if user.is_superadmin:
        return ["*"]
    if user.role and user.role.permissions:
        return [p.codename for p in user.role.permissions]
    return []
