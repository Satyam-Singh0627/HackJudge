from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserOut

class TeamMemberOut(BaseModel):
    id: str
    user_id: str
    role: str
    joined_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class TeamInviteCreate(BaseModel):
    email: str

class TeamInviteOut(BaseModel):
    id: str
    team_id: str
    email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class JoinTeamRequest(BaseModel):
    invite_code: str

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    event_id: str

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamOut(TeamBase):
    id: str
    event_id: str
    leader_id: str
    invite_code: str
    created_at: datetime
    members: List[TeamMemberOut] = []

    class Config:
        from_attributes = True
