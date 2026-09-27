from typing import List, Sequence
from fastapi import Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.models.user import User, UserRole

class RoleChecker:
    def __init__(self, allowed_roles: Sequence[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        # ADMIN has superuser privileges across all organizer and judge operations if needed
        if user.role == UserRole.ADMIN.value:
            return user
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Operation requires one of the following roles: {', '.join(self.allowed_roles)}"
            )
        return user

def require_roles(*roles: str):
    return RoleChecker(roles)

require_admin = RoleChecker([UserRole.ADMIN.value])
require_organizer = RoleChecker([UserRole.ORGANIZER.value, UserRole.ADMIN.value])
require_judge = RoleChecker([UserRole.JUDGE.value, UserRole.ADMIN.value])
require_participant = RoleChecker([UserRole.PARTICIPANT.value, UserRole.ADMIN.value])
