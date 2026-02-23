from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.core.database import get_db
from app.models.user import User
from app.models.accessory import Accessory, AccessoryAssignment
from app.api.deps import require_permissions, require_superadmin

router = APIRouter()

# Schemas
class AccessoryBase(BaseModel):
    name: str
    category: Optional[str] = None
    total_qty: int = 1
    cost: Optional[str] = None
    notes: Optional[str] = None

class AccessoryCreate(AccessoryBase):
    pass

class AccessoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    total_qty: Optional[int] = None
    cost: Optional[str] = None
    notes: Optional[str] = None

class AccessoryResponse(AccessoryBase):
    id: UUID
    available_qty: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AccessoryCheckout(BaseModel):
    user_id: UUID
    qty: int = 1

class AccessoryAssignmentResponse(BaseModel):
    id: UUID
    accessory_id: UUID
    user_id: UUID
    qty: int
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Routes
@router.get("/", response_model=List[AccessoryResponse])
async def list_accessories(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("accessories:read")),
):
    query = db.query(Accessory)
    if search:
        query = query.filter(Accessory.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{accessory_id}", response_model=AccessoryResponse)
async def get_accessory(
    accessory_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("accessories:read")),
):
    accessory = db.query(Accessory).filter(Accessory.id == accessory_id).first()
    if not accessory:
        raise HTTPException(status_code=404, detail="Accessory not found")
    return accessory

@router.post("/", response_model=AccessoryResponse, status_code=201)
async def create_accessory(
    data: AccessoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    accessory = Accessory(**data.model_dump())
    accessory.available_qty = accessory.total_qty
    db.add(accessory)
    db.commit()
    db.refresh(accessory)
    return accessory

@router.put("/{accessory_id}", response_model=AccessoryResponse)
async def update_accessory(
    accessory_id: UUID,
    data: AccessoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    accessory = db.query(Accessory).filter(Accessory.id == accessory_id).first()
    if not accessory:
        raise HTTPException(status_code=404, detail="Accessory not found")

    update_data = data.model_dump(exclude_unset=True)
    
    if "total_qty" in update_data:
        diff = update_data["total_qty"] - accessory.total_qty
        accessory.available_qty += diff

    for key, value in update_data.items():
        setattr(accessory, key, value)
        
    db.commit()
    db.refresh(accessory)
    return accessory

@router.delete("/{accessory_id}", status_code=204)
async def delete_accessory(
    accessory_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    accessory = db.query(Accessory).filter(Accessory.id == accessory_id).first()
    if not accessory:
        raise HTTPException(status_code=404, detail="Accessory not found")
    db.delete(accessory)
    db.commit()

@router.post("/{accessory_id}/checkout", response_model=AccessoryAssignmentResponse)
async def checkout_accessory(
    accessory_id: UUID,
    data: AccessoryCheckout,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    accessory = db.query(Accessory).filter(Accessory.id == accessory_id).first()
    if not accessory:
        raise HTTPException(status_code=404, detail="Accessory not found")

    if accessory.available_qty < data.qty:
        raise HTTPException(status_code=400, detail="Not enough available accessories")

    accessory.available_qty -= data.qty

    assignment = AccessoryAssignment(
        accessory_id=accessory_id,
        user_id=data.user_id,
        qty=data.qty
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
