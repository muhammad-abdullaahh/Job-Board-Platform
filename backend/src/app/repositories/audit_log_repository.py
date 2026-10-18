# Admin Audit Log Repository
# Handles database queries and persistence for administrative audit trail events.

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit_log import AdminAuditLog

class AdminAuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        admin_user_id: int,
        action: str,
        target_type: str,
        target_id: int,
        details: Optional[Dict[str, Any]] = None,
        actor_label: Optional[str] = None,
        commit: bool = True
    ) -> AdminAuditLog:
        log_entry = AdminAuditLog(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            actor_label=actor_label,
        )
        try:
            self.db.add(log_entry)
            if commit:
                self.db.commit()
                self.db.refresh(log_entry)
            else:
                self.db.flush()
            return log_entry
        except Exception:
            if commit:
                self.db.rollback()
            raise

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
        q = self.db.query(AdminAuditLog)
        if action:
            q = q.filter(AdminAuditLog.action == action)
        if target_type:
            q = q.filter(AdminAuditLog.target_type == target_type)
        if target_id is not None:
            q = q.filter(AdminAuditLog.target_id == target_id)
        if from_date:
            q = q.filter(AdminAuditLog.created_at >= from_date)
        if to_date:
            q = q.filter(AdminAuditLog.created_at <= to_date)
        return (
            q.order_by(AdminAuditLog.created_at.desc(), AdminAuditLog.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
