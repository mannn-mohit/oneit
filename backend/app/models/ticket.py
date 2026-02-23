import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="open")  # open, in_progress, resolved, closed
    priority = Column(String(20), nullable=False, default="medium")  # low, medium, high, critical
    category = Column(String(100), nullable=True)

    # SLA
    sla_due_at = Column(DateTime(timezone=True), nullable=True)
    sla_response_due_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Assignments
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    created_by_user = relationship("User", back_populates="created_tickets", foreign_keys=[created_by])
    assigned_to_user = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to])
    assets = relationship("TicketAsset", back_populates="ticket", cascade="all, delete-orphan")


class TicketAsset(Base):
    __tablename__ = "ticket_assets"

    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), primary_key=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True)

    ticket = relationship("Ticket", back_populates="assets")
    asset = relationship("Asset", back_populates="tickets")
