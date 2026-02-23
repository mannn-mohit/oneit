from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.role_ticket import (
    TicketCreate, TicketUpdate, TicketResponse, TicketListResponse,
)
from app.services.ticket_service import TicketService
from app.services.audit_service import AuditService
from app.api.deps import get_current_user

router = APIRouter()


def _ticket_to_response(ticket) -> TicketResponse:
    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        created_by=ticket.created_by,
        created_by_name=ticket.created_by_user.full_name if ticket.created_by_user else None,
        assigned_to=ticket.assigned_to,
        assigned_to_name=ticket.assigned_to_user.full_name if ticket.assigned_to_user else None,
        sla_due_at=ticket.sla_due_at,
        resolved_at=ticket.resolved_at,
        asset_ids=[ta.asset_id for ta in ticket.assets] if ticket.assets else [],
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.get("/", response_model=TicketListResponse)
async def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List tickets with filtering, search, and pagination."""
    tickets, total = TicketService.get_tickets(
        db, skip=skip, limit=limit, status=status,
        priority=priority, assigned_to=assigned_to, search=search,
    )
    return TicketListResponse(
        tickets=[_ticket_to_response(t) for t in tickets],
        total=total,
    )


@router.get("/stats")
async def get_ticket_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get ticket statistics for the dashboard."""
    return TicketService.get_ticket_stats(db)


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single ticket by ID."""
    ticket = TicketService.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_to_response(ticket)


@router.post("/", response_model=TicketResponse, status_code=201)
async def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new ticket."""
    data = ticket_data.model_dump(exclude={"asset_ids"})
    data["created_by"] = current_user.id

    ticket = TicketService.create_ticket(
        db, data, asset_ids=ticket_data.asset_ids
    )

    AuditService.log_action(
        db, "ticket", ticket.id, "create",
        performed_by=current_user.id,
    )

    # Reload with relationships
    ticket = TicketService.get_ticket(db, ticket.id)
    return _ticket_to_response(ticket)


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: UUID,
    update_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a ticket."""
    ticket = TicketService.update_ticket(
        db, ticket_id, update_data.model_dump(exclude_unset=True)
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    AuditService.log_action(
        db, "ticket", ticket.id, "update",
        performed_by=current_user.id,
    )

    ticket = TicketService.get_ticket(db, ticket.id)
    return _ticket_to_response(ticket)


@router.delete("/{ticket_id}", status_code=204)
async def delete_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a ticket."""
    ticket = TicketService.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()

    AuditService.log_action(
        db, "ticket", ticket_id, "delete",
        performed_by=current_user.id,
    )
