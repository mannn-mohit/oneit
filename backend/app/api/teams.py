from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.user import User
from app.models.team import Team, TeamMember
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamAddMember
from app.api.deps import require_permissions

router = APIRouter()

@router.get("/", response_model=List[TeamResponse])
async def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("teams:read")),
):
    """List all teams."""
    teams = db.query(Team).options(
        joinedload(Team.members).joinedload(TeamMember.user)
    ).all()
    return teams

@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("teams:read")),
):
    """Get a specific team."""
    team = db.query(Team).options(
        joinedload(Team.members).joinedload(TeamMember.user)
    ).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/", response_model=TeamResponse, status_code=201)
async def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("teams:manage")),
):
    """Create a new team."""
    existing = db.query(Team).filter(Team.name == team_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already exists")
        
    team = Team(**team_data.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: UUID,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("teams:manage")),
):
    """Update a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    update_data = team_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != team.name:
        existing = db.query(Team).filter(Team.name == update_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Team name already exists")
            
    for key, value in update_data.items():
        setattr(team, key, value)
        
    db.commit()
    db.refresh(team)
    
    # Refresh to include members
    return db.query(Team).options(
        joinedload(Team.members).joinedload(TeamMember.user)
    ).filter(Team.id == team_id).first()

@router.delete("/{team_id}", status_code=204)
async def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("teams:manage")),
):
    """Delete a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()

@router.post("/{team_id}/members", response_model=TeamResponse)
async def add_team_member(
    team_id: UUID,
    member_data: TeamAddMember,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("teams:manage")),
):
    """Add a user to a team."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_data.user_id
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this team")
        
    member = TeamMember(team_id=team_id, user_id=member_data.user_id)
    db.add(member)
    db.commit()
    
    return db.query(Team).options(
        joinedload(Team.members).joinedload(TeamMember.user)
    ).filter(Team.id == team_id).first()

@router.delete("/{team_id}/members/{user_id}", response_model=TeamResponse)
async def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("teams:manage")),
):
    """Remove a user from a team."""
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="User is not a member of this team")
        
    db.delete(member)
    db.commit()
    
    return db.query(Team).options(
        joinedload(Team.members).joinedload(TeamMember.user)
    ).filter(Team.id == team_id).first()
