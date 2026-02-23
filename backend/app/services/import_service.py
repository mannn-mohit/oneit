from __future__ import annotations

import csv
import io
import re
from typing import Any, Dict, List, Optional, Tuple

import sqlalchemy as sa
from dateutil import parser as date_parser
from sqlalchemy.orm import Session

from app.models.import_job import ImportJob, ImportMapping, ImportRowResult


_SAFE_IDENTIFIER_RE = re.compile(r"[^a-zA-Z0-9_]+")


def _normalize_header(header: str) -> str:
    return header.strip().lower()


def _safe_column_name(header: str) -> str:
    name = _normalize_header(header)
    name = name.replace(" ", "_").replace("-", "_")
    name = _SAFE_IDENTIFIER_RE.sub("_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    if not name:
        name = "col"
    if name[0].isdigit():
        name = f"col_{name}"
    return name[:63]


def _infer_type(sample_values: List[str]) -> str:
    values = [v for v in sample_values if v is not None and str(v).strip() != ""]
    if not values:
        return "text"

    def _is_int(x: str) -> bool:
        try:
            int(x)
            return True
        except Exception:
            return False

    def _is_float(x: str) -> bool:
        try:
            float(x)
            return True
        except Exception:
            return False

    def _is_bool(x: str) -> bool:
        return str(x).strip().lower() in ("true", "false", "yes", "no", "0", "1")

    def _is_datetime(x: str) -> bool:
        try:
            date_parser.parse(str(x))
            return True
        except Exception:
            return False

    if all(_is_int(v) for v in values):
        return "integer"
    if all(_is_float(v) for v in values):
        return "numeric"
    if all(_is_bool(v) for v in values):
        return "boolean"
    if all(_is_datetime(v) for v in values):
        return "timestamptz"
    return "text"


def _pg_type_sql(type_name: str) -> str:
    t = (type_name or "text").strip().lower()
    if t in ("int", "integer"):
        return "integer"
    if t in ("bool", "boolean"):
        return "boolean"
    if t in ("datetime", "timestamp", "timestamptz", "timestamp with time zone"):
        return "timestamptz"
    if t in ("numeric", "decimal", "float"):
        return "numeric"
    return "text"


def _coerce_value(value: Any, coltype: sa.types.TypeEngine) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        if value.strip() == "":
            return None
        raw = value.strip()
    else:
        raw = value

    python_type = getattr(coltype, "python_type", None)
    if python_type is int:
        return int(raw)
    if python_type is bool:
        s = str(raw).strip().lower()
        if s in ("true", "yes", "1"):
            return True
        if s in ("false", "no", "0"):
            return False
        return None
    if python_type is float:
        return float(raw)

    if isinstance(coltype, (sa.DateTime, sa.TIMESTAMP)):
        dt = date_parser.parse(str(raw))
        return dt

    return str(raw)


class ImportService:
    ENTITY_TABLES: dict[str, str] = {
        "assets": "assets",
        "components": "components",
        "accessories": "accessories",
        "roles": "roles",
        "asset_types": "asset_types",
    }

    @staticmethod
    def preview_csv(entity_type: str, content: bytes, sample_size: int = 10) -> tuple[list[str], list[dict[str, Any]], list[str], list[dict[str, Any]]]:
        if entity_type not in ImportService.ENTITY_TABLES:
            raise ValueError(f"Unsupported entity_type: {entity_type}")

        text = content.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        headers = reader.fieldnames or []
        normalized_headers = [_normalize_header(h) for h in headers]

        sample_rows: list[dict[str, Any]] = []
        for i, row in enumerate(reader):
            if i >= sample_size:
                break
            sample_rows.append(row)

        return headers, sample_rows, normalized_headers, []  # suggestions computed in API using DB reflection

    @staticmethod
    def get_existing_fields(db: Session, entity_type: str) -> list[str]:
        table_name = ImportService.ENTITY_TABLES.get(entity_type)
        if not table_name:
            raise ValueError(f"Unsupported entity_type: {entity_type}")

        meta = sa.MetaData()
        table = sa.Table(table_name, meta, autoload_with=db.get_bind())
        return [c.name for c in table.columns]

    @staticmethod
    def create_missing_columns(
        db: Session,
        table_name: str,
        new_columns: list[tuple[str, str]],
    ) -> None:
        for col_name, type_name in new_columns:
            col_sql_type = _pg_type_sql(type_name)
            sql = sa.text(f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col_name}" {col_sql_type}')
            db.execute(sql)

    @staticmethod
    def execute_import(
        db: Session,
        *,
        entity_type: str,
        content: bytes,
        mappings: list[dict[str, Any]],
        created_by: sa.types.UUID,
        original_filename: Optional[str] = None,
        create_missing_columns: bool = True,
        store_row_results: bool = True,
    ) -> ImportJob:
        table_name = ImportService.ENTITY_TABLES.get(entity_type)
        if not table_name:
            raise ValueError(f"Unsupported entity_type: {entity_type}")

        job = ImportJob(
            entity_type=entity_type,
            status="processing",
            original_filename=original_filename,
            created_by=created_by,
            total_rows=0,
            success_count=0,
            error_count=0,
            summary={},
        )
        db.add(job)
        db.flush()

        mapping_models: list[ImportMapping] = []
        new_cols_to_create: list[tuple[str, str]] = []

        # We infer types from sample values (quick pass)
        text = content.decode("utf-8-sig", errors="replace")
        reader_for_infer = csv.DictReader(io.StringIO(text))
        infer_samples: dict[str, list[str]] = {}
        for i, row in enumerate(reader_for_infer):
            if i >= 25:
                break
            for k, v in row.items():
                infer_samples.setdefault(k or "", []).append(v or "")

        for m in mappings:
            csv_header = m["csv_header"]
            model_field = m.get("model_field")
            create_col = bool(m.get("create_new_column"))
            inferred = m.get("inferred_db_type")
            if not inferred:
                inferred = _infer_type(infer_samples.get(csv_header, []))

            created_column_name = None
            if create_col:
                created_column_name = _safe_column_name(csv_header)
                new_cols_to_create.append((created_column_name, inferred))

            mapping_models.append(
                ImportMapping(
                    job_id=job.id,
                    csv_header=csv_header,
                    model_field=model_field,
                    create_new_column=create_col,
                    created_column_name=created_column_name,
                    inferred_db_type=inferred,
                )
            )

        db.add_all(mapping_models)
        db.flush()

        if create_missing_columns and new_cols_to_create:
            ImportService.create_missing_columns(db, table_name, new_cols_to_create)
            db.flush()

        meta = sa.MetaData()
        table = sa.Table(table_name, meta, autoload_with=db.get_bind())

        # Build header->column mapping
        header_to_column: dict[str, str] = {}
        for mm in mapping_models:
            if mm.create_new_column:
                if mm.created_column_name:
                    header_to_column[mm.csv_header] = mm.created_column_name
            else:
                if mm.model_field:
                    header_to_column[mm.csv_header] = mm.model_field

        # Insert pass
        reader = csv.DictReader(io.StringIO(text))
        row_results: list[ImportRowResult] = []

        for idx, row in enumerate(reader, start=1):
            job.total_rows += 1
            insert_data: dict[str, Any] = {}
            raw_row: dict[str, Any] = dict(row)

            try:
                for header, col_name in header_to_column.items():
                    if col_name not in table.c:
                        continue
                    insert_data[col_name] = _coerce_value(row.get(header), table.c[col_name].type)

                with db.begin_nested():
                    db.execute(table.insert().values(**insert_data))

                job.success_count += 1
                if store_row_results:
                    row_results.append(
                        ImportRowResult(
                            job_id=job.id,
                            row_index=idx,
                            status="success",
                            raw_row=raw_row,
                        )
                    )
            except Exception as e:
                job.error_count += 1
                if store_row_results:
                    row_results.append(
                        ImportRowResult(
                            job_id=job.id,
                            row_index=idx,
                            status="error",
                            error_message=str(e),
                            raw_row=raw_row,
                        )
                    )

        if store_row_results and row_results:
            db.add_all(row_results)

        job.status = "completed" if job.error_count == 0 else "partial"
        job.summary = {
            "table": table_name,
            "created_columns": [{"name": n, "type": _pg_type_sql(t)} for n, t in new_cols_to_create],
        }
        db.commit()
        db.refresh(job)
        return job

