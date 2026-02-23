from pydantic import BaseModel
from typing import Any, Optional, List, Dict
from uuid import UUID
from datetime import datetime


class ImportColumnSuggestion(BaseModel):
    csv_header: str
    suggested_field: Optional[str] = None
    is_existing_field: bool


class ImportPreviewResponse(BaseModel):
    entity_type: str
    headers: List[str]
    sample_rows: List[Dict[str, Any]]
    existing_fields: List[str]
    suggestions: List[ImportColumnSuggestion]


class ImportMappingRequest(BaseModel):
    csv_header: str
    model_field: Optional[str] = None
    create_new_column: bool = False
    inferred_db_type: Optional[str] = None  # text, integer, boolean, timestamptz, numeric


class ImportExecuteRequest(BaseModel):
    mappings: List[ImportMappingRequest]
    create_missing_columns: bool = True
    store_row_results: bool = True


class ImportJobResponse(BaseModel):
    id: UUID
    entity_type: str
    status: str
    original_filename: Optional[str] = None
    created_by: UUID
    total_rows: int
    success_count: int
    error_count: int
    summary: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

