import hashlib
import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.voting import CommunityVote, Comment
from app.models.project import Project, Submission, SubmissionStatus
from app.models.event import Event
from app.models.user import User
from app.schemas.voting import VoteCreate, CommentCreate
from app.audit.audit_service import log_audit_event

def cast_community_vote(
    db: Session,
    vote_in: VoteCreate,
    user: User,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> CommunityVote:
    project = db.query(Project).filter(Project.id == vote_in.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    event = db.query(Event).filter(Event.id == project.event_id).first()
    if not event or not event.voting_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Community voting is not enabled for this event")

    now = datetime.now(timezone.utc)
    if event.voting_start_date:
        start = event.voting_start_date.replace(tzinfo=timezone.utc) if event.voting_start_date.tzinfo is None else event.voting_start_date
        if now < start:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voting has not started yet")
    if event.voting_end_date:
        end = event.voting_end_date.replace(tzinfo=timezone.utc) if event.voting_end_date.tzinfo is None else event.voting_end_date
        if now > end:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voting has closed")

    # Anti-Abuse 1: Sybil check / Account age check
    # Account must be at least 15 minutes old to vote
    user_created = user.created_at.replace(tzinfo=timezone.utc) if user.created_at.tzinfo is None else user.created_at
    if (now - user_created) < timedelta(minutes=5):
        log_audit_event(
            db,
            action="VOTE_REJECTED",
            resource_type="vote",
            resource_id=vote_in.project_id,
            user_id=user.id,
            details="Account too new (Sybil prevention quarantine)",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is in new-user quarantine period. Please try voting later."
        )

    # Anti-Abuse 2: Rate limit checks (max 10 votes in the last 60 seconds)
    recent_votes_count = db.query(CommunityVote).filter(
        CommunityVote.user_id == user.id,
        CommunityVote.created_at >= (now - timedelta(seconds=60))
    ).count()
    if recent_votes_count >= 10:
        log_audit_event(
            db,
            action="VOTE_REJECTED",
            resource_type="vote",
            resource_id=vote_in.project_id,
            user_id=user.id,
            details="Rate limit exceeded",
            ip_address=ip_address
        )
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many voting attempts. Please slow down.")

    # Anti-Abuse 3: Duplicate vote check
    dup = db.query(CommunityVote).filter(
        CommunityVote.user_id == user.id,
        CommunityVote.project_id == vote_in.project_id
    ).first()
    if dup:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already voted for this project.")

    # Anti-Abuse 4: Quota check
    existing_user_votes = db.query(CommunityVote).filter(
        CommunityVote.user_id == user.id,
        CommunityVote.event_id == event.id
    ).count()
    if existing_user_votes >= event.votes_per_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached your maximum vote limit ({event.votes_per_user} votes)."
        )

    # Prevent voting for one's own project
    from app.models.team import TeamMember
    own_team = db.query(TeamMember).filter(
        TeamMember.team_id == project.team_id,
        TeamMember.user_id == user.id
    ).first()
    if own_team:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot vote for your own team's project.")

    vote = CommunityVote(
        event_id=event.id,
        project_id=project.id,
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)

    log_audit_event(
        db,
        action="VOTE_CAST",
        resource_type="vote",
        resource_id=vote.id,
        user_id=user.id,
        details={"project_id": project.id, "event_id": event.id},
        ip_address=ip_address
    )
    return vote

def get_randomized_gallery_projects(
    db: Session,
    event_id: str,
    seed_token: Optional[str] = None
) -> List[Project]:
    """
    Returns submitted projects in a deterministic, pseudo-random order based on a seed
    to prevent positional presentation bias.
    """
    projects = (
        db.query(Project)
        .join(Submission, Project.id == Submission.project_id)
        .filter(Project.event_id == event_id, Project.is_published == True)
        .all()
    )

    if not projects:
        return []

    # Use seed token or today's date hash as seed for reproducible permutation
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    combined_seed = f"{event_id}-{seed_token or 'global'}-{today_str}"
    hash_int = int(hashlib.sha256(combined_seed.encode()).hexdigest(), 16)
    
    rng = random.Random(hash_int)
    shuffled = list(projects)
    rng.shuffle(shuffled)
    return shuffled

def add_comment(db: Session, comment_in: CommentCreate, user: User) -> Comment:
    project = db.query(Project).filter(Project.id == comment_in.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    content = comment_in.content.strip()
    if not content or len(content) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment must be at least 3 characters")

    comment = Comment(
        project_id=project.id,
        user_id=user.id,
        content=content,
        is_moderated=False
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    log_audit_event(
        db,
        action="COMMENT_CREATED",
        resource_type="comment",
        resource_id=comment.id,
        user_id=user.id,
        details={"project_id": project.id}
    )
    return comment
