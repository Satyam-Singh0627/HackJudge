from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.event import Event, Track, Prize, EventRegistration
from app.schemas.event import (
    EventCreate, EventUpdate, EventOut, TrackCreate, TrackOut,
    PrizeCreate, PrizeOut, RegistrationOut
)
from app.auth.dependencies import get_current_user, get_current_user_optional
from app.permissions.role_checker import require_organizer
from app.services.event_service import (
    create_event, update_event, get_event, get_event_by_slug, add_track, add_prize
)
from app.audit.audit_service import log_audit_event

router = APIRouter(prefix="/events", tags=["Events"])

def event_to_out(event: Event) -> EventOut:
    return EventOut(
        id=event.id,
        title=event.title,
        slug=event.slug,
        description=event.description,
        reg_start_date=event.reg_start_date,
        reg_end_date=event.reg_end_date,
        submission_start_date=event.submission_start_date,
        submission_end_date=event.submission_end_date,
        judging_start_date=event.judging_start_date,
        judging_end_date=event.judging_end_date,
        results_date=event.results_date,
        min_team_size=event.min_team_size,
        max_team_size=event.max_team_size,
        voting_enabled=event.voting_enabled,
        voting_start_date=event.voting_start_date,
        voting_end_date=event.voting_end_date,
        votes_per_user=event.votes_per_user,
        hide_live_voting_results=event.hide_live_voting_results,
        status_override=event.status_override,
        created_by_id=event.created_by_id,
        created_at=event.created_at,
        updated_at=event.updated_at,
        status=event.get_derived_status(),
        tracks=[TrackOut.model_validate(t) for t in event.tracks],
        prizes=[PrizeOut.model_validate(p) for p in event.prizes]
    )

@router.get("", response_model=List[EventOut])
def list_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return [event_to_out(e) for e in events]

@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_new_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    event = create_event(db, event_in, current_user.id)
    return event_to_out(event)

@router.get("/{identifier}", response_model=EventOut)
def get_event_detail(identifier: str, db: Session = Depends(get_db)):
    event = get_event(db, identifier) or get_event_by_slug(db, identifier)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event_to_out(event)

@router.patch("/{event_id}", response_model=EventOut)
def update_event_by_id(
    event_id: str,
    event_update: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    event = update_event(db, event_id, event_update, current_user.id)
    return event_to_out(event)

@router.post("/{event_id}/tracks", response_model=TrackOut, status_code=status.HTTP_201_CREATED)
def add_event_track(
    event_id: str,
    track_in: TrackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    track = add_track(db, event_id, track_in)
    return track

@router.post("/{event_id}/prizes", response_model=PrizeOut, status_code=status.HTTP_201_CREATED)
def add_event_prize(
    event_id: str,
    prize_in: PrizeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    prize = add_prize(db, event_id, prize_in)
    return prize

@router.post("/{event_id}/register", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()
    if existing:
        return existing

    reg = EventRegistration(event_id=event_id, user_id=current_user.id)
    db.add(reg)
    db.commit()
    db.refresh(reg)

    log_audit_event(
        db,
        action="EVENT_REGISTERED",
        resource_type="event_registration",
        resource_id=reg.id,
        user_id=current_user.id,
        details={"event_id": event_id}
    )
    return reg
