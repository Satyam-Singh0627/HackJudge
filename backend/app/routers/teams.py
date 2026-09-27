from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.team import Team, TeamMember
from app.schemas.team import TeamCreate, TeamOut, JoinTeamRequest, TeamMemberOut
from app.auth.dependencies import get_current_user
from app.services.team_service import (
    create_team, join_team_by_code, get_team, get_user_team_for_event, remove_team_member
)

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("", response_model=List[TeamOut])
def list_teams(event_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Team)
    if event_id:
        query = query.filter(Team.event_id == event_id)
    return query.all()

@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_new_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_team(db, team_in, current_user)

@router.get("/my-team", response_model=Optional[TeamOut])
def get_my_team(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = get_user_team_for_event(db, event_id, current_user.id)
    return team

@router.get("/{team_id}", response_model=TeamOut)
def get_team_by_id(team_id: str, db: Session = Depends(get_db)):
    team = get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team

@router.post("/join", response_model=TeamOut)
def join_team(
    join_req: JoinTeamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return join_team_by_code(db, join_req.invite_code, current_user)

@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_200_OK)
def remove_member(
    team_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = remove_team_member(db, team_id, user_id, current_user)
    return {"success": success, "message": "Team membership updated"}
