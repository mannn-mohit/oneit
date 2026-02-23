from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        entity_type: str,
        entity_id: UUID,
        action: str,
        performed_by: UUID,
        changes: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Create an immutable audit log entry."""
        log = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            changes=changes,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def get_entity_history(
        db: Session,
        entity_type: str,
        entity_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple:
        """Get audit history for a specific entity."""
        query = db.query(AuditLog).filter(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id,
        ).order_by(AuditLog.created_at.desc())

        total = query.count()
        logs = query.offset(skip).limit(limit).all()
        return logs, total

    @staticmethod
    def get_user_activity(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple:
        """Get all activity performed by a specific user."""
        query = db.query(AuditLog).filter(
            AuditLog.performed_by == user_id
        ).order_by(AuditLog.created_at.desc())

        total = query.count()
        logs = query.offset(skip).limit(limit).all()
        return logs, total

    @staticmethod
    def compute_changes(old_values: dict, new_values: dict) -> Dict[str, Any]:
        """Compute a diff between old and new values for audit logging."""
        changes = {}
        for key, new_val in new_values.items():
            if new_val is not None:
                old_val = old_values.get(key)
                if old_val != new_val:
                    changes[key] = {"old": str(old_val) if old_val else None, "new": str(new_val)}
        return changes
