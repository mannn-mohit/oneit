from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetAssign, AssetResponse,
    AssetListResponse, AssetBulkImport,
)
from app.services.asset_service import AssetService
from app.services.audit_service import AuditService
from app.api.deps import get_current_user, require_permissions

router = APIRouter()


def _asset_to_response(asset) -> AssetResponse:
    return AssetResponse(
        id=asset.id,
        name=asset.name,
        asset_tag=asset.asset_tag,
        asset_type_id=asset.asset_type_id,
        asset_type_name=asset.asset_type.name if asset.asset_type else None,
        serial_number=asset.serial_number,
        notes=asset.notes,
        metadata_fields=asset.metadata_fields or {},
        status=asset.status,
        assigned_to=asset.assigned_to,
        assigned_to_name=asset.assigned_to_user.full_name if asset.assigned_to_user else None,
        assigned_at=asset.assigned_at,
        purchase_date=asset.purchase_date,
        purchase_cost=asset.purchase_cost,
        warranty_expiry=asset.warranty_expiry,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


@router.get("/", response_model=AssetListResponse)
async def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    asset_type_id: Optional[UUID] = None,
    assigned_to: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List assets with filtering, search, and pagination."""
    if not current_user.is_superadmin:
        assigned_to = current_user.id

    assets, total = AssetService.get_assets(
        db, skip=skip, limit=limit, status=status,
        asset_type_id=asset_type_id, search=search, assigned_to=assigned_to,
    )
    return AssetListResponse(
        assets=[_asset_to_response(a) for a in assets],
        total=total,
    )


@router.get("/stats")
async def get_asset_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("assets:read")),
):
    """Get asset statistics for the dashboard."""
    viewer_id = None if current_user.is_superadmin else current_user.id
    return AssetService.get_asset_stats(db, viewer_id=viewer_id)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single asset by ID."""
    asset = AssetService.get_asset(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if not current_user.is_superadmin and asset.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this asset")

    return _asset_to_response(asset)


@router.post("/", response_model=AssetResponse, status_code=201)
async def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("assets:create")),
):
    """Create a new asset."""
    asset = AssetService.create_asset(db, asset_data.model_dump())
    AuditService.log_action(
        db, "asset", asset.id, "create",
        performed_by=current_user.id,
    )
    return _asset_to_response(asset)


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: UUID,
    update_data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("assets:update")),
):
    """Update an existing asset."""
    asset = AssetService.update_asset(
        db, asset_id, update_data.model_dump(exclude_unset=True)
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    AuditService.log_action(
        db, "asset", asset.id, "update",
        performed_by=current_user.id,
    )
    return _asset_to_response(asset)


@router.delete("/{asset_id}", status_code=204)
async def delete_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("assets:delete")),
):
    """Delete an asset."""
    success = AssetService.delete_asset(db, asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    AuditService.log_action(
        db, "asset", asset_id, "delete",
        performed_by=current_user.id,
    )


@router.post("/{asset_id}/assign", response_model=AssetResponse)
async def assign_asset(
    asset_id: UUID,
    assignment: AssetAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("assets:assign")),
):
    """Assign or unassign an asset to/from a user."""
    asset = AssetService.assign_asset(db, asset_id, assignment.user_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset or user not found")
    AuditService.log_action(
        db, "asset", asset.id, "assign",
        performed_by=current_user.id,
        changes={"assigned_to": str(assignment.user_id) if assignment.user_id else None},
    )
    return _asset_to_response(asset)


@router.post("/bulk-import", response_model=list[AssetResponse], status_code=201)
async def bulk_import_assets(
    bulk_data: AssetBulkImport,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("assets:import")),
):
    """Bulk import multiple assets."""
    assets = AssetService.bulk_create_assets(
        db, [a.model_dump() for a in bulk_data.assets]
    )
    return [_asset_to_response(a) for a in assets]
