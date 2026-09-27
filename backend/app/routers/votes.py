from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.voting import CommunityVote
from app.schemas.voting import VoteCreate, VoteOut, VotingStatsOut
from app.auth.dependencies import get_current_user
from app.permissions.role_checker import require_organizer
from app.services.voting_service import cast_community_vote

router = APIRouter(prefix="/votes", tags=["Community Voting"])

@router.post("", response_model=VoteOut, status_code=status.HTTP_201_CREATED)
def vote_for_project(
    vote_in: VoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_addr = request.client.host if request.client else None
    ua = request.headers.get("User-Agent")
    return cast_community_vote(db, vote_in, current_user, ip_address=ip_addr, user_agent=ua)

@router.get("/stats/{event_id}", response_model=VotingStatsOut)
def get_user_voting_stats(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    total_votes = db.query(CommunityVote).filter(CommunityVote.event_id == event_id).count()
    user_votes = db.query(CommunityVote).filter(
        CommunityVote.event_id == event_id,
        CommunityVote.user_id == current_user.id
    ).count()

    remaining = max(0, event.votes_per_user - user_votes)

    return VotingStatsOut(
        event_id=event_id,
        total_votes=total_votes,
        user_votes_cast=user_votes,
        user_votes_remaining=remaining,
        voting_enabled=event.voting_enabled,
        live_results_hidden=event.hide_live_voting_results
    )
