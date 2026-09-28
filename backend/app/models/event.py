import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class EventStatus(str):
    DRAFT = "DRAFT"
    REGISTRATION_OPEN = "REGISTRATION_OPEN"
    SUBMISSION_OPEN = "SUBMISSION_OPEN"
    SUBMISSION_CLOSED = "SUBMISSION_CLOSED"
    JUDGING = "JUDGING"
    RESULTS = "RESULTS"
    ARCHIVED = "ARCHIVED"

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    status_override = Column(String(50), nullable=True) # If set, overrides dynamic calculation

    reg_start_date = Column(DateTime, nullable=False)
    reg_end_date = Column(DateTime, nullable=False)
    submission_start_date = Column(DateTime, nullable=False)
    submission_end_date = Column(DateTime, nullable=False)
    judging_start_date = Column(DateTime, nullable=False)
    judging_end_date = Column(DateTime, nullable=False)
    results_date = Column(DateTime, nullable=False)

    min_team_size = Column(Integer, default=1, nullable=False)
    max_team_size = Column(Integer, default=4, nullable=False)

    voting_enabled = Column(Boolean, default=False, nullable=False)
    voting_start_date = Column(DateTime, nullable=True)
    voting_end_date = Column(DateTime, nullable=True)
    votes_per_user = Column(Integer, default=3, nullable=False)
    hide_live_voting_results = Column(Boolean, default=True, nullable=False)

    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    tracks = relationship("Track", back_populates="event", cascade="all, delete-orphan")
    prizes = relationship("Prize", back_populates="event", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="event", cascade="all, delete-orphan")

    def get_derived_status(self) -> str:
        if self.status_override:
            return self.status_override
        now = datetime.now(timezone.utc)
        
        # Ensure dates are treated properly
        reg_start = self.reg_start_date.replace(tzinfo=timezone.utc) if self.reg_start_date.tzinfo is None else self.reg_start_date
        reg_end = self.reg_end_date.replace(tzinfo=timezone.utc) if self.reg_end_date.tzinfo is None else self.reg_end_date
        sub_start = self.submission_start_date.replace(tzinfo=timezone.utc) if self.submission_start_date.tzinfo is None else self.submission_start_date
        sub_end = self.submission_end_date.replace(tzinfo=timezone.utc) if self.submission_end_date.tzinfo is None else self.submission_end_date
        jud_start = self.judging_start_date.replace(tzinfo=timezone.utc) if self.judging_start_date.tzinfo is None else self.judging_start_date
        jud_end = self.judging_end_date.replace(tzinfo=timezone.utc) if self.judging_end_date.tzinfo is None else self.judging_end_date
        res_date = self.results_date.replace(tzinfo=timezone.utc) if self.results_date.tzinfo is None else self.results_date

        if now >= res_date:
            return EventStatus.RESULTS
        elif jud_start <= now < jud_end:
            return EventStatus.JUDGING
        elif sub_end <= now < jud_start:
            return EventStatus.SUBMISSION_CLOSED
        elif sub_start <= now < sub_end:
            return EventStatus.SUBMISSION_OPEN
        elif reg_start <= now < reg_end:
            return EventStatus.REGISTRATION_OPEN
        else:
            return EventStatus.DRAFT

class Track(Base):
    __tablename__ = "tracks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="tracks")

class Prize(Base):
    __tablename__ = "prizes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(String(36), ForeignKey("tracks.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    amount_usd = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="prizes")

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="registrations")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user_registration"),
    )

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="announcements")
