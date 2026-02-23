import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Text, Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)  # Nullable for SSO users
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superadmin = Column(Boolean, default=False)

    # SSO fields
    sso_provider = Column(String(50), nullable=True)  # "saml", "oauth", "ldap"
    sso_id = Column(String(255), nullable=True, index=True)

    # Role
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)
    role = relationship("Role", back_populates="users")

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    assigned_assets = relationship("Asset", back_populates="assigned_to_user", foreign_keys="Asset.assigned_to")
    created_tickets = relationship("Ticket", back_populates="created_by_user", foreign_keys="Ticket.created_by")
    assigned_tickets = relationship("Ticket", back_populates="assigned_to_user", foreign_keys="Ticket.assigned_to")
