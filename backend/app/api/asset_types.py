from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.asset_type import AssetType
from app.models.field_definition import FieldDefinition
from app.schemas.asset import (
    AssetTypeCreate, AssetTypeUpdate, AssetTypeResponse,
    AssetTypeListResponse, FieldDefinitionCreate, FieldDefinitionResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=AssetTypeListResponse)
async def list_asset_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all asset types with their field definitions."""
    asset_types = db.query(AssetType).all()
    return AssetTypeListResponse(
        asset_types=[
            AssetTypeResponse(
                id=at.id,
                name=at.name,
                slug=at.slug,
                description=at.description,
                icon=at.icon,
                is_active=at.is_active,
                field_definitions=[
                    FieldDefinitionResponse(
                        id=fd.id,
                        name=fd.name,
                        slug=fd.slug,
                        field_type=fd.field_type,
                        is_required=fd.is_required,
                        order=fd.order,
                        options=fd.options,
                        default_value=fd.default_value,
                        placeholder=fd.placeholder,
                    )
                    for fd in sorted(at.field_definitions, key=lambda x: x.order)
                ],
                created_at=at.created_at,
            )
            for at in asset_types
        ],
        total=len(asset_types),
    )


@router.get("/{asset_type_id}", response_model=AssetTypeResponse)
async def get_asset_type(
    asset_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific asset type with its field definitions."""
    at = db.query(AssetType).filter(AssetType.id == asset_type_id).first()
    if not at:
        raise HTTPException(status_code=404, detail="Asset type not found")
    return AssetTypeResponse(
        id=at.id,
        name=at.name,
        slug=at.slug,
        description=at.description,
        icon=at.icon,
        is_active=at.is_active,
        field_definitions=[
            FieldDefinitionResponse(
                id=fd.id,
                name=fd.name,
                slug=fd.slug,
                field_type=fd.field_type,
                is_required=fd.is_required,
                order=fd.order,
                options=fd.options,
                default_value=fd.default_value,
                placeholder=fd.placeholder,
            )
            for fd in sorted(at.field_definitions, key=lambda x: x.order)
        ],
        created_at=at.created_at,
    )


@router.post("/", response_model=AssetTypeResponse, status_code=201)
async def create_asset_type(
    data: AssetTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new asset type with field definitions."""
    existing = db.query(AssetType).filter(AssetType.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Asset type slug already exists")

    asset_type = AssetType(
        name=data.name,
        slug=data.slug,
        description=data.description,
        icon=data.icon,
    )
    db.add(asset_type)
    db.flush()

    if data.field_definitions:
        for fd_data in data.field_definitions:
            fd = FieldDefinition(
                asset_type_id=asset_type.id,
                **fd_data.model_dump(),
            )
            db.add(fd)

    db.commit()
    db.refresh(asset_type)

    return AssetTypeResponse(
        id=asset_type.id,
        name=asset_type.name,
        slug=asset_type.slug,
        description=asset_type.description,
        icon=asset_type.icon,
        is_active=asset_type.is_active,
        field_definitions=[
            FieldDefinitionResponse(
                id=fd.id,
                name=fd.name,
                slug=fd.slug,
                field_type=fd.field_type,
                is_required=fd.is_required,
                order=fd.order,
                options=fd.options,
                default_value=fd.default_value,
                placeholder=fd.placeholder,
            )
            for fd in asset_type.field_definitions
        ],
        created_at=asset_type.created_at,
    )


@router.put("/{asset_type_id}", response_model=AssetTypeResponse)
async def update_asset_type(
    asset_type_id: UUID,
    update_data: AssetTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an asset type."""
    at = db.query(AssetType).filter(AssetType.id == asset_type_id).first()
    if not at:
        raise HTTPException(status_code=404, detail="Asset type not found")

    if update_data.name is not None:
        at.name = update_data.name
    if update_data.description is not None:
        at.description = update_data.description
    if update_data.icon is not None:
        at.icon = update_data.icon
    if update_data.is_active is not None:
        at.is_active = update_data.is_active

    db.commit()
    db.refresh(at)

    return AssetTypeResponse(
        id=at.id,
        name=at.name,
        slug=at.slug,
        description=at.description,
        icon=at.icon,
        is_active=at.is_active,
        field_definitions=[
            FieldDefinitionResponse(
                id=fd.id,
                name=fd.name,
                slug=fd.slug,
                field_type=fd.field_type,
                is_required=fd.is_required,
                order=fd.order,
                options=fd.options,
                default_value=fd.default_value,
                placeholder=fd.placeholder,
            )
            for fd in sorted(at.field_definitions, key=lambda x: x.order)
        ],
        created_at=at.created_at,
    )


@router.post("/{asset_type_id}/fields", response_model=FieldDefinitionResponse, status_code=201)
async def add_field_definition(
    asset_type_id: UUID,
    field_data: FieldDefinitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a field definition to an asset type."""
    at = db.query(AssetType).filter(AssetType.id == asset_type_id).first()
    if not at:
        raise HTTPException(status_code=404, detail="Asset type not found")

    fd = FieldDefinition(
        asset_type_id=asset_type_id,
        **field_data.model_dump(),
    )
    db.add(fd)
    db.commit()
    db.refresh(fd)

    return FieldDefinitionResponse(
        id=fd.id,
        name=fd.name,
        slug=fd.slug,
        field_type=fd.field_type,
        is_required=fd.is_required,
        order=fd.order,
        options=fd.options,
        default_value=fd.default_value,
        placeholder=fd.placeholder,
    )


@router.delete("/{asset_type_id}", status_code=204)
async def delete_asset_type(
    asset_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an asset type and its field definitions."""
    at = db.query(AssetType).filter(AssetType.id == asset_type_id).first()
    if not at:
        raise HTTPException(status_code=404, detail="Asset type not found")
    if at.assets:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete asset type with existing assets",
        )
    db.delete(at)
    db.commit()
