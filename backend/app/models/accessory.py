import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Accessory(Base):
    __tablename__ = "accessories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=True)
    total_qty = Column(Integer, nullable=False, default=1)
    available_qty = Column(Integer, nullable=False, default=1)
    cost = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assignments = relationship("AccessoryAssignment", back_populates="accessory", cascade="all, delete-orphan")


class AccessoryAssignment(Base):
    __tablename__ = "accessory_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    accessory_id = Column(UUID(as_uuid=True), ForeignKey("accessories.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    qty = Column(Integer, nullable=False, default=1)

    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    accessory = relationship("Accessory", back_populates="assignments")
    user = relationship("User")
