from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.team import Team, TeamMember, TeamInvite
from app.models.event import Event
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate
from app.audit.audit_service import log_audit_event

def get_team(db: Session, team_id: str) -> Optional[Team]:
    return db.query(Team).filter(Team.id == team_id).first()

def get_user_team_for_event(db: Session, event_id: str, user_id: str) -> Optional[Team]:
    return (
        db.query(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .filter(Team.event_id == event_id, TeamMember.user_id == user_id)
        .first()
    )

def create_team(db: Session, team_in: TeamCreate, user: User) -> Team:
    event = db.query(Event).filter(Event.id == team_in.event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    # Check if user is already in a team for this event
    existing_team = get_user_team_for_event(db, team_in.event_id, user.id)
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a team for this event."
        )
    
    # Check duplicate name in event
    dup = db.query(Team).filter(Team.event_id == team_in.event_id, Team.name == team_in.name).first()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team with name '{team_in.name}' already exists in this event."
        )

    team = Team(
        event_id=team_in.event_id,
        name=team_in.name,
        description=team_in.description,
        leader_id=user.id,
    )
    db.add(team)
    db.flush()

    # Add leader as initial member
    leader_member = TeamMember(
        team_id=team.id,
        user_id=user.id,
        role="LEADER"
    )
    db.add(leader_member)
    db.commit()
    db.refresh(team)

    log_audit_event(
        db,
        action="TEAM_CREATED",
        resource_type="team",
        resource_id=team.id,
        user_id=user.id,
        details={"team_name": team.name, "event_id": team.event_id}
    )
    return team

def join_team_by_code(db: Session, invite_code: str, user: User) -> Team:
    team = db.query(Team).filter(Team.invite_code == invite_code).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid team invite code")

    # Check if user already in a team for this event
    existing_team = get_user_team_for_event(db, team.event_id, user.id)
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of a team in this event."
        )

    # Check max team size
    event = db.query(Event).filter(Event.id == team.event_id).first()
    current_members_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if event and current_members_count >= event.max_team_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This team has already reached maximum capacity ({event.max_team_size} members)."
        )

    new_member = TeamMember(
        team_id=team.id,
        user_id=user.id,
        role="MEMBER"
    )
    db.add(new_member)
    db.commit()
    db.refresh(team)

    log_audit_event(
        db,
        action="TEAM_JOINED",
        resource_type="team",
        resource_id=team.id,
        user_id=user.id,
        details={"team_id": team.id}
    )
    return team

def remove_team_member(db: Session, team_id: str, target_user_id: str, requesting_user: User) -> bool:
    team = get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    is_leader = team.leader_id == requesting_user.id
    is_self = target_user_id == requesting_user.id
    is_admin = requesting_user.role in ("ADMIN", "ORGANIZER")

    if not (is_leader or is_self or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to remove this member")

    member = db.query(TeamMember).filter(TeamMember.team_id == team_id, TeamMember.user_id == target_user_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not in team")

    # If leader leaves and there are other members, reassign leadership
    all_members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    if target_user_id == team.leader_id:
        remaining = [m for m in all_members if m.user_id != target_user_id]
        if remaining:
            next_leader = remaining[0]
            next_leader.role = "LEADER"
            team.leader_id = next_leader.user_id
        else:
            # Delete team if last member leaves
            db.delete(member)
            db.delete(team)
            db.commit()
            log_audit_event(db, "TEAM_DELETED", "team", team_id, requesting_user.id)
            return True

    db.delete(member)
    db.commit()

    log_audit_event(
        db,
        action="TEAM_MEMBER_REMOVED",
        resource_type="team",
        resource_id=team_id,
        user_id=requesting_user.id,
        details={"removed_user_id": target_user_id}
    )
    return True
