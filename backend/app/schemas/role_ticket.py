from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# --- Permission ---
class PermissionResponse(BaseModel):
    id: UUID
    codename: str
    name: str
    description: Optional[str] = None
    module: str

    class Config:
        from_attributes = True


# --- Role ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: Optional[List[UUID]] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[UUID]] = None


class RoleResponse(RoleBase):
    id: UUID
    is_system: bool
    permissions: List[PermissionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    roles: List[RoleResponse]
    total: int


# --- Ticket ---
class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    category: Optional[str] = None


class TicketCreate(TicketBase):
    assigned_to: Optional[UUID] = None
    asset_ids: Optional[List[UUID]] = []


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[UUID] = None


class TicketResponse(TicketBase):
    id: UUID
    ticket_number: str
    status: str
    created_by: UUID
    created_by_name: Optional[str] = None
    assigned_to: Optional[UUID] = None
    assigned_to_name: Optional[str] = None
    sla_due_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    asset_ids: List[UUID] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TicketListResponse(BaseModel):
    tickets: List[TicketResponse]
    total: int
