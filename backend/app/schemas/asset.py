from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from uuid import UUID
from datetime import datetime


# --- Asset Type ---
class FieldDefinitionBase(BaseModel):
    name: str
    slug: str
    field_type: str  # text, number, date, select, boolean, url, email
    is_required: bool = False
    order: int = 0
    options: Optional[Dict[str, Any]] = None
    default_value: Optional[str] = None
    placeholder: Optional[str] = None


class FieldDefinitionCreate(FieldDefinitionBase):
    pass


class FieldDefinitionResponse(FieldDefinitionBase):
    id: UUID

    class Config:
        from_attributes = True


class AssetTypeBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


class AssetTypeCreate(AssetTypeBase):
    field_definitions: Optional[List[FieldDefinitionCreate]] = []


class AssetTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class AssetTypeResponse(AssetTypeBase):
    id: UUID
    is_active: bool
    field_definitions: List[FieldDefinitionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class AssetTypeListResponse(BaseModel):
    asset_types: List[AssetTypeResponse]
    total: int


# --- Asset ---
class AssetBase(BaseModel):
    name: str
    asset_tag: str
    asset_type_id: UUID
    serial_number: Optional[str] = None
    notes: Optional[str] = None
    metadata_fields: Optional[Dict[str, Any]] = {}
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[str] = None
    warranty_expiry: Optional[datetime] = None


class AssetCreate(AssetBase):
    assigned_to: Optional[UUID] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    metadata_fields: Optional[Dict[str, Any]] = None
    assigned_to: Optional[UUID] = None
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[str] = None
    warranty_expiry: Optional[datetime] = None


class AssetAssign(BaseModel):
    user_id: Optional[UUID] = None  # None to unassign


class AssetResponse(AssetBase):
    id: UUID
    status: str
    assigned_to: Optional[UUID] = None
    assigned_to_name: Optional[str] = None
    asset_type_name: Optional[str] = None
    assigned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    assets: List[AssetResponse]
    total: int


class AssetBulkImport(BaseModel):
    assets: List[AssetCreate]
