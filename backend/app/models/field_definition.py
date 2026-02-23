import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class FieldDefinition(Base):
    __tablename__ = "field_definitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_type_id = Column(UUID(as_uuid=True), ForeignKey("asset_types.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False)
    field_type = Column(String(50), nullable=False)  # text, number, date, select, boolean, url, email
    is_required = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    options = Column(JSONB, nullable=True)  # For select fields: {"choices": ["opt1", "opt2"]}
    default_value = Column(String(500), nullable=True)
    placeholder = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    asset_type = relationship("AssetType", back_populates="field_definitions")
