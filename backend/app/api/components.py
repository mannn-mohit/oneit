from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.core.database import get_db
from app.models.user import User
from app.models.component import Component, ComponentAssignment
from app.api.deps import require_permissions, require_superadmin

router = APIRouter()

# Schemas
class ComponentBase(BaseModel):
    name: str
    category: Optional[str] = None
    serial_number: Optional[str] = None
    total_qty: int = 1
    cost: Optional[str] = None
    notes: Optional[str] = None

class ComponentCreate(ComponentBase):
    pass

class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    serial_number: Optional[str] = None
    total_qty: Optional[int] = None
    cost: Optional[str] = None
    notes: Optional[str] = None

class ComponentResponse(ComponentBase):
    id: UUID
    available_qty: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComponentCheckout(BaseModel):
    asset_id: UUID
    qty: int = 1

class ComponentAssignmentResponse(BaseModel):
    id: UUID
    component_id: UUID
    asset_id: UUID
    qty: int
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Routes
@router.get("/", response_model=List[ComponentResponse])
async def list_components(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("components:read")),
):
    query = db.query(Component)
    if search:
        query = query.filter(Component.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.get("/{component_id}", response_model=ComponentResponse)
async def get_component(
    component_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("components:read")),
):
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    return component

@router.post("/", response_model=ComponentResponse, status_code=201)
async def create_component(
    data: ComponentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    component = Component(**data.model_dump())
    component.available_qty = component.total_qty
    db.add(component)
    db.commit()
    db.refresh(component)
    return component

@router.put("/{component_id}", response_model=ComponentResponse)
async def update_component(
    component_id: UUID,
    data: ComponentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    update_data = data.model_dump(exclude_unset=True)
    
    if "total_qty" in update_data:
        diff = update_data["total_qty"] - component.total_qty
        component.available_qty += diff

    for key, value in update_data.items():
        setattr(component, key, value)
        
    db.commit()
    db.refresh(component)
    return component

@router.delete("/{component_id}", status_code=204)
async def delete_component(
    component_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    db.delete(component)
    db.commit()

@router.post("/{component_id}/checkout", response_model=ComponentAssignmentResponse)
async def checkout_component(
    component_id: UUID,
    data: ComponentCheckout,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    component = db.query(Component).filter(Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    if component.available_qty < data.qty:
        raise HTTPException(status_code=400, detail="Not enough available components")

    component.available_qty -= data.qty

    assignment = ComponentAssignment(
        component_id=component_id,
        asset_id=data.asset_id,
        qty=data.qty
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment
