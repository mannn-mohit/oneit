"""add_import_jobs

Revision ID: 9d3c2b7b9a12
Revises: 48269175b6e9
Create Date: 2026-02-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "9d3c2b7b9a12"
down_revision: Union[str, None] = "48269175b6e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "import_jobs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("total_rows", sa.Integer(), nullable=False),
        sa.Column("success_count", sa.Integer(), nullable=False),
        sa.Column("error_count", sa.Integer(), nullable=False),
        sa.Column("summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_import_jobs_entity_type"), "import_jobs", ["entity_type"], unique=False)

    op.create_table(
        "import_mappings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("job_id", sa.UUID(), nullable=False),
        sa.Column("csv_header", sa.String(length=255), nullable=False),
        sa.Column("model_field", sa.String(length=255), nullable=True),
        sa.Column("create_new_column", sa.Boolean(), nullable=False),
        sa.Column("created_column_name", sa.String(length=255), nullable=True),
        sa.Column("inferred_db_type", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(["job_id"], ["import_jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_import_mappings_job_id"), "import_mappings", ["job_id"], unique=False)

    op.create_table(
        "import_row_results",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("job_id", sa.UUID(), nullable=False),
        sa.Column("row_index", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("raw_row", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["job_id"], ["import_jobs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_import_row_results_job_id"), "import_row_results", ["job_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_import_row_results_job_id"), table_name="import_row_results")
    op.drop_table("import_row_results")
    op.drop_index(op.f("ix_import_mappings_job_id"), table_name="import_mappings")
    op.drop_table("import_mappings")
    op.drop_index(op.f("ix_import_jobs_entity_type"), table_name="import_jobs")
    op.drop_table("import_jobs")

