from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamMemberResponse(BaseModel):
    user_id: UUID
    user: UserResponse
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TeamResponse(TeamBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    members: List[TeamMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)

class TeamAddMember(BaseModel):
    user_id: UUID
