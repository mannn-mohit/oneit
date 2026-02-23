import json
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.deps import require_superadmin
from app.schemas.imports import (
    ImportPreviewResponse,
    ImportColumnSuggestion,
    ImportExecuteRequest,
    ImportJobResponse,
)
from app.services.import_service import ImportService


router = APIRouter()

def _normalize_header(header: str) -> str:
    return header.strip().lower()


@router.post("/{entity_type}/preview", response_model=ImportPreviewResponse)
async def preview_import(
    entity_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    try:
        content = await file.read()
        headers, sample_rows, _normalized_headers, _ = ImportService.preview_csv(entity_type, content)
        existing_fields = ImportService.get_existing_fields(db, entity_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

    existing_norm = {_normalize_header(f): f for f in existing_fields}

    suggestions: List[ImportColumnSuggestion] = []
    for h in headers:
        nh = _normalize_header(h)
        suggested = existing_norm.get(nh)
        suggestions.append(
            ImportColumnSuggestion(
                csv_header=h,
                suggested_field=suggested,
                is_existing_field=bool(suggested),
            )
        )

    # Provide sample rows as dicts keyed by original headers
    return ImportPreviewResponse(
        entity_type=entity_type,
        headers=headers,
        sample_rows=sample_rows,
        existing_fields=existing_fields,
        suggestions=suggestions,
    )


@router.post("/{entity_type}/execute", response_model=ImportJobResponse)
async def execute_import(
    entity_type: str,
    request_json: str = Form(...),
    create_missing_columns: bool = Form(True),
    store_row_results: bool = Form(True),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    try:
        # request_json is a JSON string matching ImportExecuteRequest schema
        payload = json.loads(request_json)
        if "mappings" not in payload:
            payload["mappings"] = []
        payload.setdefault("create_missing_columns", create_missing_columns)
        payload.setdefault("store_row_results", store_row_results)
        request = ImportExecuteRequest.model_validate(payload)

        content = await file.read()
        job = ImportService.execute_import(
            db,
            entity_type=entity_type,
            content=content,
            mappings=[m.model_dump() for m in request.mappings],
            created_by=current_user.id,
            original_filename=file.filename,
            create_missing_columns=request.create_missing_columns,
            store_row_results=request.store_row_results,
        )
        return job  # response_model handles conversion
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid request_json (must be valid JSON)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {e}")

