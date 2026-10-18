# Admin Audit Log Service
# Coordinates audit log retrieval and filtering for the administrative dashboard.

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.repositories.audit_log_repository import AdminAuditLogRepository
from app.models.audit_log import AdminAuditLog

class AuditLogService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AdminAuditLogRepository(db)

    def list_logs(
        self,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[AdminAuditLog]:
        return self.audit_repo.list_logs(
            action=action,
            target_type=target_type,
            target_id=target_id,
            from_date=from_date,
            to_date=to_date,
            skip=skip,
            limit=limit,
        )

    def record_action(
        self,
        admin_user_id: int,
        action: str,
        target_type: str,
        target_id: int,
        details: Optional[Dict[str, Any]] = None,
        actor_label: Optional[str] = None,
        commit: bool = True
    ) -> AdminAuditLog:
        return self.audit_repo.create(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            actor_label=actor_label,
            commit=commit
        )
