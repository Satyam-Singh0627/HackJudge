from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogOut
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_organizer

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
        
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        AuditLogOut(
            id=l.id,
            user_id=l.user_id,
            username=l.user.username if l.user else None,
            action=l.action,
            resource_type=l.resource_type,
            resource_id=l.resource_id,
            details=l.details,
            ip_address=l.ip_address,
            created_at=l.created_at
        )
        for l in logs
    ]
