from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.ticket import Ticket, TicketAsset
from app.models.user import User

# SLA durations by priority (in hours)
SLA_DURATIONS = {
    "critical": 4,
    "high": 8,
    "medium": 24,
    "low": 72,
}

SLA_RESPONSE_DURATIONS = {
    "critical": 1,
    "high": 2,
    "medium": 8,
    "low": 24,
}


class TicketService:
    _ticket_counter = 0

    @staticmethod
    def generate_ticket_number(db: Session) -> str:
        """Generate a unique ticket number."""
        last_ticket = db.query(Ticket).order_by(Ticket.created_at.desc()).first()
        if last_ticket and last_ticket.ticket_number:
            try:
                num = int(last_ticket.ticket_number.replace("TKT-", ""))
                return f"TKT-{num + 1:06d}"
            except ValueError:
                pass
        return "TKT-000001"

    @staticmethod
    def calculate_sla(priority: str) -> tuple:
        """Calculate SLA due dates based on priority."""
        now = datetime.now(timezone.utc)
        resolution_hours = SLA_DURATIONS.get(priority, 24)
        response_hours = SLA_RESPONSE_DURATIONS.get(priority, 8)
        return (
            now + timedelta(hours=resolution_hours),
            now + timedelta(hours=response_hours),
        )

    @staticmethod
    def get_tickets(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[UUID] = None,
        created_by: Optional[UUID] = None,
        search: Optional[str] = None,
        viewer_id: Optional[UUID] = None,
    ) -> tuple:
        """Get paginated list of tickets with filters."""
        query = db.query(Ticket).options(
            joinedload(Ticket.created_by_user),
            joinedload(Ticket.assigned_to_user),
            joinedload(Ticket.assets),
        )

        if viewer_id:
            query = query.filter((Ticket.created_by == viewer_id) | (Ticket.assigned_to == viewer_id))
        else:
            if assigned_to:
                query = query.filter(Ticket.assigned_to == assigned_to)
            if created_by:
                query = query.filter(Ticket.created_by == created_by)

        if status:
            query = query.filter(Ticket.status == status)
        if priority:
            query = query.filter(Ticket.priority == priority)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Ticket.title.ilike(search_term))
                | (Ticket.ticket_number.ilike(search_term))
            )

        total = query.count()
        tickets = query.offset(skip).limit(limit).all()
        return tickets, total

    @staticmethod
    def get_ticket(db: Session, ticket_id: UUID) -> Optional[Ticket]:
        """Get a single ticket by ID."""
        return (
            db.query(Ticket)
            .options(
                joinedload(Ticket.created_by_user),
                joinedload(Ticket.assigned_to_user),
                joinedload(Ticket.assets),
            )
            .filter(Ticket.id == ticket_id)
            .first()
        )

    @staticmethod
    def create_ticket(db: Session, ticket_data: dict, asset_ids: List[UUID] = None) -> Ticket:
        """Create a new ticket with SLA tracking."""
        sla_due, sla_response = TicketService.calculate_sla(ticket_data.get("priority", "medium"))
        ticket_data["ticket_number"] = TicketService.generate_ticket_number(db)
        ticket_data["sla_due_at"] = sla_due
        ticket_data["sla_response_due_at"] = sla_response

        ticket = Ticket(**ticket_data)
        db.add(ticket)
        db.flush()

        if asset_ids:
            for asset_id in asset_ids:
                ticket_asset = TicketAsset(ticket_id=ticket.id, asset_id=asset_id)
                db.add(ticket_asset)

        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def update_ticket(db: Session, ticket_id: UUID, update_data: dict) -> Optional[Ticket]:
        """Update ticket, tracking resolution time if resolved."""
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return None

        for key, value in update_data.items():
            if value is not None:
                setattr(ticket, key, value)

        # Track resolution time
        if update_data.get("status") in ("resolved", "closed") and not ticket.resolved_at:
            ticket.resolved_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def get_ticket_stats(db: Session, viewer_id: Optional[UUID] = None) -> dict:
        """Get ticket statistics for the dashboard."""
        base_query = db.query(Ticket)
        if viewer_id:
            base_query = base_query.filter((Ticket.created_by == viewer_id) | (Ticket.assigned_to == viewer_id))

        total = base_query.with_entities(func.count(Ticket.id)).scalar()
        open_count = base_query.with_entities(func.count(Ticket.id)).filter(Ticket.status == "open").scalar()
        in_progress = base_query.with_entities(func.count(Ticket.id)).filter(Ticket.status == "in_progress").scalar()
        resolved = base_query.with_entities(func.count(Ticket.id)).filter(Ticket.status == "resolved").scalar()

        # Overdue tickets
        now = datetime.now(timezone.utc)
        overdue = base_query.with_entities(func.count(Ticket.id)).filter(
            Ticket.sla_due_at < now,
            Ticket.status.in_(["open", "in_progress"]),
        ).scalar()

        return {
            "total": total,
            "open": open_count,
            "in_progress": in_progress,
            "resolved": resolved,
            "overdue": overdue,
        }
