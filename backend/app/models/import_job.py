import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False, index=True)  # assets, components, etc.
    status = Column(String(30), nullable=False, default="pending")  # pending, processing, completed, failed, partial

    original_filename = Column(String(255), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    total_rows = Column(Integer, nullable=False, default=0)
    success_count = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)

    summary = Column(JSONB, default=dict)  # free-form summary/config

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    mappings = relationship("ImportMapping", back_populates="job", cascade="all, delete-orphan")
    row_results = relationship("ImportRowResult", back_populates="job", cascade="all, delete-orphan")


class ImportMapping(Base):
    __tablename__ = "import_mappings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("import_jobs.id"), nullable=False, index=True)

    csv_header = Column(String(255), nullable=False)
    model_field = Column(String(255), nullable=True)  # db column name; null if create_new_column

    create_new_column = Column(Boolean, nullable=False, default=False)
    created_column_name = Column(String(255), nullable=True)
    inferred_db_type = Column(String(50), nullable=True)  # e.g. text, integer

    job = relationship("ImportJob", back_populates="mappings")


class ImportRowResult(Base):
    __tablename__ = "import_row_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("import_jobs.id"), nullable=False, index=True)

    row_index = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False)  # success, error, skipped
    error_message = Column(Text, nullable=True)
    raw_row = Column(JSONB, default=dict)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    job = relationship("ImportJob", back_populates="row_results")

