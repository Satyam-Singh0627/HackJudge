from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class TrackBase(BaseModel):
    name: str
    description: Optional[str] = None

class TrackCreate(TrackBase):
    pass

class TrackOut(TrackBase):
    id: str
    event_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class PrizeBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount_usd: float = 0.0
    track_id: Optional[str] = None

class PrizeCreate(PrizeBase):
    pass

class PrizeOut(PrizeBase):
    id: str
    event_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnnouncementBase(BaseModel):
    title: str
    content: str
    is_pinned: bool = False

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementOut(AnnouncementBase):
    id: str
    event_id: str
    created_by_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class EventBase(BaseModel):

    title: str
    slug: str
    description: str
    reg_start_date: datetime
    reg_end_date: datetime
    submission_start_date: datetime
    submission_end_date: datetime
    judging_start_date: datetime
    judging_end_date: datetime
    results_date: datetime
    min_team_size: int = 1
    max_team_size: int = 4
    voting_enabled: bool = False
    voting_start_date: Optional[datetime] = None
    voting_end_date: Optional[datetime] = None
    votes_per_user: int = 3
    hide_live_voting_results: bool = True
    status_override: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reg_start_date: Optional[datetime] = None
    reg_end_date: Optional[datetime] = None
    submission_start_date: Optional[datetime] = None
    submission_end_date: Optional[datetime] = None
    judging_start_date: Optional[datetime] = None
    judging_end_date: Optional[datetime] = None
    results_date: Optional[datetime] = None
    min_team_size: Optional[int] = None
    max_team_size: Optional[int] = None
    voting_enabled: Optional[bool] = None
    voting_start_date: Optional[datetime] = None
    voting_end_date: Optional[datetime] = None
    votes_per_user: Optional[int] = None
    hide_live_voting_results: Optional[bool] = None
    status_override: Optional[str] = None

class EventOut(EventBase):
    id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    status: str
    tracks: List[TrackOut] = []
    prizes: List[PrizeOut] = []
    announcements: List[AnnouncementOut] = []

    class Config:
        from_attributes = True

class RegistrationOut(BaseModel):
    id: str
    event_id: str
    user_id: str
    registered_at: datetime

    class Config:
        from_attributes = True
