import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_tag = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="available")  # available, assigned, maintenance, retired
    asset_type_id = Column(UUID(as_uuid=True), ForeignKey("asset_types.id"), nullable=False)
    serial_number = Column(String(255), nullable=True, index=True)
    notes = Column(Text, nullable=True)

    # Dynamic metadata stored as JSONB
    metadata_fields = Column(JSONB, default=dict)

    # Assignment
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)

    # Purchase info
    purchase_date = Column(DateTime(timezone=True), nullable=True)
    purchase_cost = Column(String(50), nullable=True)
    warranty_expiry = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    asset_type = relationship("AssetType", back_populates="assets")
    assigned_to_user = relationship("User", back_populates="assigned_assets", foreign_keys=[assigned_to])
    tickets = relationship("TicketAsset", back_populates="asset")
