from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.role import Role
from app.models.permission import Permission
from app.models.user import User
from app.schemas.role_ticket import (
    RoleCreate, RoleUpdate, RoleResponse, RoleListResponse, PermissionResponse,
)
from app.api.deps import require_permissions

router = APIRouter()


@router.get("/", response_model=RoleListResponse)
async def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:read")),
):
    """List all roles."""
    roles = db.query(Role).all()
    return RoleListResponse(
        roles=[
            RoleResponse(
                id=r.id,
                name=r.name,
                description=r.description,
                is_system=r.is_system,
                permissions=[
                    PermissionResponse(
                        id=p.id,
                        codename=p.codename,
                        name=p.name,
                        description=p.description,
                        module=p.module,
                    )
                    for p in r.permissions
                ],
                created_at=r.created_at,
            )
            for r in roles
        ],
        total=len(roles),
    )


@router.post("/", response_model=RoleResponse, status_code=201)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:manage")),
):
    """Create a new role (admin only)."""
    existing = db.query(Role).filter(Role.name == role_data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Role name already exists")

    role = Role(name=role_data.name, description=role_data.description)

    if role_data.permission_ids:
        permissions = db.query(Permission).filter(
            Permission.id.in_(role_data.permission_ids)
        ).all()
        role.permissions = permissions

    db.add(role)
    db.commit()
    db.refresh(role)

    return RoleResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        permissions=[
            PermissionResponse(
                id=p.id, codename=p.codename, name=p.name,
                description=p.description, module=p.module,
            )
            for p in role.permissions
        ],
        created_at=role.created_at,
    )


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: UUID,
    update_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:manage")),
):
    """Update a role (admin only)."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if update_data.name is not None:
        role.name = update_data.name
    if update_data.description is not None:
        role.description = update_data.description
    if update_data.permission_ids is not None:
        permissions = db.query(Permission).filter(
            Permission.id.in_(update_data.permission_ids)
        ).all()
        role.permissions = permissions

    db.commit()
    db.refresh(role)

    return RoleResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        permissions=[
            PermissionResponse(
                id=p.id, codename=p.codename, name=p.name,
                description=p.description, module=p.module,
            )
            for p in role.permissions
        ],
        created_at=role.created_at,
    )


@router.delete("/{role_id}", status_code=204)
async def delete_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:manage")),
):
    """Delete a role (admin only)."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    db.delete(role)
    db.commit()


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("roles:read")),
):
    """List all available permissions."""
    permissions = db.query(Permission).all()
    return [
        PermissionResponse(
            id=p.id,
            codename=p.codename,
            name=p.name,
            description=p.description,
            module=p.module,
        )
        for p in permissions
    ]
