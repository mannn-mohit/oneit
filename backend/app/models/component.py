import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Component(Base):
    __tablename__ = "components"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=True)
    serial_number = Column(String(255), nullable=True, index=True)
    total_qty = Column(Integer, nullable=False, default=1)
    available_qty = Column(Integer, nullable=False, default=1)
    cost = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assignments = relationship("ComponentAssignment", back_populates="component", cascade="all, delete-orphan")


class ComponentAssignment(Base):
    __tablename__ = "component_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id = Column(UUID(as_uuid=True), ForeignKey("components.id"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    qty = Column(Integer, nullable=False, default=1)

    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    component = relationship("Component", back_populates="assignments")
    asset = relationship("Asset")
