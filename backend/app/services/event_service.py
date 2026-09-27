from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.event import Event, Track, Prize, EventRegistration, EventStatus
from app.schemas.event import EventCreate, EventUpdate, TrackCreate, PrizeCreate
from app.audit.audit_service import log_audit_event

def get_event(db: Session, event_id: str) -> Optional[Event]:
    return db.query(Event).filter(Event.id == event_id).first()

def get_event_by_slug(db: Session, slug: str) -> Optional[Event]:
    return db.query(Event).filter(Event.slug == slug).first()

def create_event(db: Session, event_in: EventCreate, creator_id: str) -> Event:
    existing = get_event_by_slug(db, event_in.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Event with slug '{event_in.slug}' already exists."
        )
    
    # Ensure chronology of dates
    if event_in.reg_start_date >= event_in.reg_end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration start must precede registration end")
    if event_in.submission_start_date >= event_in.submission_end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Submission start must precede submission end")
    if event_in.judging_start_date >= event_in.judging_end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Judging start must precede judging end")

    event = Event(
        title=event_in.title,
        slug=event_in.slug,
        description=event_in.description,
        reg_start_date=event_in.reg_start_date,
        reg_end_date=event_in.reg_end_date,
        submission_start_date=event_in.submission_start_date,
        submission_end_date=event_in.submission_end_date,
        judging_start_date=event_in.judging_start_date,
        judging_end_date=event_in.judging_end_date,
        results_date=event_in.results_date,
        min_team_size=event_in.min_team_size,
        max_team_size=event_in.max_team_size,
        voting_enabled=event_in.voting_enabled,
        voting_start_date=event_in.voting_start_date,
        voting_end_date=event_in.voting_end_date,
        votes_per_user=event_in.votes_per_user,
        hide_live_voting_results=event_in.hide_live_voting_results,
        status_override=event_in.status_override,
        created_by_id=creator_id
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    log_audit_event(
        db,
        action="EVENT_CREATED",
        resource_type="event",
        resource_id=event.id,
        user_id=creator_id,
        details={"slug": event.slug, "title": event.title}
    )
    return event

def update_event(db: Session, event_id: str, event_update: EventUpdate, user_id: str) -> Event:
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)

    log_audit_event(
        db,
        action="EVENT_UPDATED",
        resource_type="event",
        resource_id=event.id,
        user_id=user_id,
        details=list(update_data.keys())
    )
    return event

def is_submission_open(event: Event) -> bool:
    now = datetime.now(timezone.utc)
    sub_start = event.submission_start_date.replace(tzinfo=timezone.utc) if event.submission_start_date.tzinfo is None else event.submission_start_date
    sub_end = event.submission_end_date.replace(tzinfo=timezone.utc) if event.submission_end_date.tzinfo is None else event.submission_end_date
    return sub_start <= now <= sub_end

def is_judging_open(event: Event) -> bool:
    now = datetime.now(timezone.utc)
    jud_start = event.judging_start_date.replace(tzinfo=timezone.utc) if event.judging_start_date.tzinfo is None else event.judging_start_date
    jud_end = event.judging_end_date.replace(tzinfo=timezone.utc) if event.judging_end_date.tzinfo is None else event.judging_end_date
    return jud_start <= now <= jud_end

def add_track(db: Session, event_id: str, track_in: TrackCreate) -> Track:
    track = Track(event_id=event_id, name=track_in.name, description=track_in.description)
    db.add(track)
    db.commit()
    db.refresh(track)
    return track

def add_prize(db: Session, event_id: str, prize_in: PrizeCreate) -> Prize:
    prize = Prize(
        event_id=event_id,
        track_id=prize_in.track_id,
        title=prize_in.title,
        description=prize_in.description,
        amount_usd=prize_in.amount_usd
    )
    db.add(prize)
    db.commit()
    db.refresh(prize)
    return prize
